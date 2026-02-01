/**
 * HOOPERITS CMS - Computed Fields Engine (Spec 007)
 * Calculates and manages computed field values
 */

import type {
  DocumentContext,
  ComputedFunction,
  SchemaDefinition,
  FieldDefinition,
} from './types';

/**
 * Result of computed field calculation
 */
export interface ComputedFieldsResult {
  /** Updated document with computed values */
  document: DocumentContext;
  /** Map of computed field names to their values */
  computedValues: Map<string, unknown>;
  /** Any errors that occurred during computation */
  errors: Map<string, string>;
}

/**
 * Dependency information for a computed field
 */
export interface ComputedFieldDependency {
  fieldName: string;
  dependsOn: string[];
}

/**
 * Circular dependency check result
 */
export interface ComputedCircularCheck {
  hasCircular: boolean;
  cycle?: string[];
}

/**
 * Checks if a field has a computed function
 *
 * @param field - Field definition
 * @returns true if field is computed
 */
export function isComputedField(field: FieldDefinition): boolean {
  return typeof field.options.computed === 'function';
}

/**
 * Gets all computed fields from a schema
 *
 * @param schema - Schema definition
 * @returns Array of [fieldName, computedFunction] pairs
 */
export function getComputedFields(
  schema: SchemaDefinition
): Array<[string, ComputedFunction]> {
  const computed: Array<[string, ComputedFunction]> = [];

  for (const [fieldName, field] of Object.entries(schema.fields)) {
    if (isComputedField(field)) {
      computed.push([fieldName, field.options.computed as ComputedFunction]);
    }
  }

  return computed;
}

/**
 * Extracts dependencies from a computed function
 * Similar to visibility dependency extraction
 *
 * @param computeFn - Computed function
 * @returns Array of field names the function depends on
 */
export function getComputedDependencies(computeFn: ComputedFunction): string[] {
  const fnString = computeFn.toString();
  const dependencies: string[] = [];

  // Match patterns like: doc.fieldName, doc['fieldName'], doc["fieldName"]
  const dotNotation = /doc\.(\w+)/g;
  const bracketNotation = /doc\[['"](\w+)['"]\]/g;

  let match;
  while ((match = dotNotation.exec(fnString)) !== null) {
    if (!dependencies.includes(match[1])) {
      dependencies.push(match[1]);
    }
  }

  while ((match = bracketNotation.exec(fnString)) !== null) {
    if (!dependencies.includes(match[1])) {
      dependencies.push(match[1]);
    }
  }

  return dependencies;
}

/**
 * Builds dependency graph for computed fields
 *
 * @param schema - Schema definition
 * @returns Array of computed field dependencies
 */
export function buildComputedDependencyGraph(
  schema: SchemaDefinition
): ComputedFieldDependency[] {
  const graph: ComputedFieldDependency[] = [];

  for (const [fieldName, field] of Object.entries(schema.fields)) {
    if (isComputedField(field)) {
      const deps = getComputedDependencies(
        field.options.computed as ComputedFunction
      );
      graph.push({ fieldName, dependsOn: deps });
    }
  }

  return graph;
}

/**
 * Detects circular dependencies in computed fields
 *
 * @param schema - Schema definition
 * @returns Check result with cycle path if found
 */
export function detectComputedCircularDependencies(
  schema: SchemaDefinition
): ComputedCircularCheck {
  const deps = buildComputedDependencyGraph(schema);
  const depMap = new Map<string, string[]>();

  for (const { fieldName, dependsOn } of deps) {
    depMap.set(fieldName, dependsOn);
  }

  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): string[] | null {
    if (recursionStack.has(node)) {
      const cycleStart = path.indexOf(node);
      return [...path.slice(cycleStart), node];
    }

    if (visited.has(node)) {
      return null;
    }

    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const nodeDeps = depMap.get(node) || [];
    for (const dep of nodeDeps) {
      // Check if dep is a computed field (could create cycle)
      if (depMap.has(dep)) {
        const cycle = dfs(dep);
        if (cycle) return cycle;
      }
    }

    path.pop();
    recursionStack.delete(node);
    return null;
  }

  for (const fieldName of depMap.keys()) {
    const cycle = dfs(fieldName);
    if (cycle) {
      return { hasCircular: true, cycle };
    }
  }

  return { hasCircular: false };
}

/**
 * Topologically sorts computed fields for correct evaluation order
 * Fields that depend on others are evaluated after their dependencies
 *
 * @param schema - Schema definition
 * @returns Array of field names in evaluation order
 */
export function getComputationOrder(schema: SchemaDefinition): string[] {
  const deps = buildComputedDependencyGraph(schema);
  const depMap = new Map<string, string[]>();
  const computedFields = new Set<string>();

  for (const { fieldName, dependsOn } of deps) {
    depMap.set(fieldName, dependsOn);
    computedFields.add(fieldName);
  }

  const result: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(node: string): void {
    if (visited.has(node)) return;
    if (visiting.has(node)) {
      // Cycle detected - should have been caught by detectComputedCircularDependencies
      throw new Error(`Circular dependency detected involving: ${node}`);
    }

    visiting.add(node);

    const nodeDeps = depMap.get(node) || [];
    for (const dep of nodeDeps) {
      // Only visit computed field dependencies
      if (computedFields.has(dep)) {
        visit(dep);
      }
    }

    visiting.delete(node);
    visited.add(node);
    result.push(node);
  }

  for (const fieldName of computedFields) {
    visit(fieldName);
  }

  return result;
}

/**
 * Calculates a single computed field value
 *
 * @param computeFn - Computed function
 * @param doc - Current document state
 * @returns Computed value or undefined on error
 */
export function calculateComputedField(
  computeFn: ComputedFunction,
  doc: DocumentContext
): unknown {
  try {
    return computeFn(doc);
  } catch (error) {
    console.error('Error calculating computed field:', error);
    return undefined;
  }
}

/**
 * Calculates all computed fields in correct order
 *
 * @param schema - Schema definition
 * @param doc - Current document state
 * @returns Result with updated document and computed values
 */
export function calculateComputedFields(
  schema: SchemaDefinition,
  doc: DocumentContext
): ComputedFieldsResult {
  const computedValues = new Map<string, unknown>();
  const errors = new Map<string, string>();

  // Get evaluation order
  const order = getComputationOrder(schema);

  // Create a working copy of the document
  const workingDoc: DocumentContext = { ...doc };

  // Calculate each field in order
  for (const fieldName of order) {
    const field = schema.fields[fieldName];
    if (!field || !isComputedField(field)) continue;

    try {
      const value = (field.options.computed as ComputedFunction)(workingDoc);
      workingDoc[fieldName] = value;
      computedValues.set(fieldName, value);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Computation error';
      errors.set(fieldName, errorMessage);
      console.error(`Error computing field ${fieldName}:`, error);
    }
  }

  return {
    document: workingDoc,
    computedValues,
    errors,
  };
}

/**
 * Gets fields that need to be recalculated when a field changes
 *
 * @param schema - Schema definition
 * @param changedField - Name of field that changed
 * @returns Array of computed field names that depend on the changed field
 */
export function getFieldsToRecalculate(
  schema: SchemaDefinition,
  changedField: string
): string[] {
  const deps = buildComputedDependencyGraph(schema);
  const affected: string[] = [];

  // Direct dependencies
  for (const { fieldName, dependsOn } of deps) {
    if (dependsOn.includes(changedField)) {
      affected.push(fieldName);
    }
  }

  // Transitive dependencies (if A depends on B and B changes, A needs recalc)
  const order = getComputationOrder(schema);
  const needsRecalc = new Set(affected);

  for (const fieldName of order) {
    const dep = deps.find((d) => d.fieldName === fieldName);
    if (!dep) continue;

    // If any dependency needs recalculation, this field does too
    for (const d of dep.dependsOn) {
      if (needsRecalc.has(d)) {
        needsRecalc.add(fieldName);
        break;
      }
    }
  }

  // Return in computation order
  return order.filter((f) => needsRecalc.has(f));
}
