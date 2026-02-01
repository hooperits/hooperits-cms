/**
 * HOOPERITS CMS - Field Visibility Engine (Spec 007)
 * Evaluates conditional field visibility based on document state
 */

import type {
  DocumentContext,
  VisibilityCondition,
  FieldDefinition,
  SchemaDefinition,
} from './types';

/**
 * Result of visibility evaluation for a single field
 */
export interface FieldVisibilityResult {
  fieldName: string;
  isHidden: boolean;
  hasValue: boolean;
}

/**
 * Result of visibility evaluation for all fields
 */
export interface VisibilityEvaluationResult {
  /** Map of field name to hidden state */
  hiddenFields: Map<string, boolean>;
  /** Fields that became hidden and have values (need cleanup prompt) */
  fieldsNeedingCleanup: string[];
}

/**
 * Circular dependency detection result
 */
export interface CircularDependencyCheck {
  hasCircular: boolean;
  cycle?: string[];
}

/**
 * Evaluates whether a single field should be hidden based on document state
 *
 * @param field - Field definition to evaluate
 * @param doc - Current document state
 * @returns true if field should be hidden
 */
export function evaluateFieldVisibility(
  field: FieldDefinition,
  doc: DocumentContext
): boolean {
  const hidden = field.options.hidden;

  // Boolean hidden value
  if (typeof hidden === 'boolean') {
    return hidden;
  }

  // Function-based visibility condition
  if (typeof hidden === 'function') {
    try {
      return (hidden as VisibilityCondition)(doc);
    } catch (error) {
      // Log error but don't hide field on error
      console.error('Error evaluating visibility condition:', error);
      return false;
    }
  }

  // Default: not hidden
  return false;
}

/**
 * Evaluates visibility for all fields in a schema
 *
 * @param schema - Schema definition
 * @param doc - Current document state
 * @param previousHiddenState - Previous hidden state for detecting transitions
 * @returns Visibility evaluation result
 */
export function evaluateAllFieldVisibility(
  schema: SchemaDefinition,
  doc: DocumentContext,
  previousHiddenState?: Map<string, boolean>
): VisibilityEvaluationResult {
  const hiddenFields = new Map<string, boolean>();
  const fieldsNeedingCleanup: string[] = [];

  for (const [fieldName, field] of Object.entries(schema.fields)) {
    const isHidden = evaluateFieldVisibility(field, doc);
    hiddenFields.set(fieldName, isHidden);

    // Check if field transitioned from visible to hidden and has a value
    if (
      previousHiddenState &&
      !previousHiddenState.get(fieldName) &&
      isHidden &&
      hasValue(doc[fieldName])
    ) {
      fieldsNeedingCleanup.push(fieldName);
    }
  }

  return { hiddenFields, fieldsNeedingCleanup };
}

/**
 * Checks if a value is considered "having a value" (not empty/null/undefined)
 */
function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/**
 * Extracts field dependencies from visibility conditions
 * Used for optimizing re-evaluation (only re-evaluate when dependencies change)
 *
 * Note: This is a heuristic approach - we parse the function string to find
 * property access patterns. For complex conditions, may not be 100% accurate.
 *
 * @param condition - Visibility condition function
 * @returns Array of field names the condition depends on
 */
export function getVisibilityDependencies(
  condition: VisibilityCondition
): string[] {
  const fnString = condition.toString();
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
 * Builds a dependency graph for visibility conditions
 *
 * @param schema - Schema definition
 * @returns Map of field name to array of fields it depends on
 */
export function buildVisibilityDependencyGraph(
  schema: SchemaDefinition
): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const [fieldName, field] of Object.entries(schema.fields)) {
    const hidden = field.options.hidden;

    if (typeof hidden === 'function') {
      const deps = getVisibilityDependencies(hidden as VisibilityCondition);
      graph.set(fieldName, deps);
    } else {
      graph.set(fieldName, []);
    }
  }

  return graph;
}

/**
 * Detects circular dependencies in visibility conditions
 * A depends on B depends on A would be a circular dependency
 *
 * @param schema - Schema definition
 * @returns Check result with cycle path if circular dependency found
 */
export function detectCircularDependencies(
  schema: SchemaDefinition
): CircularDependencyCheck {
  const graph = buildVisibilityDependencyGraph(schema);
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): string[] | null {
    if (recursionStack.has(node)) {
      // Found cycle - extract cycle from path
      const cycleStart = path.indexOf(node);
      return [...path.slice(cycleStart), node];
    }

    if (visited.has(node)) {
      return null;
    }

    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const deps = graph.get(node) || [];
    for (const dep of deps) {
      // Only check dependencies that are also fields with visibility conditions
      if (graph.has(dep)) {
        const cycle = dfs(dep);
        if (cycle) return cycle;
      }
    }

    path.pop();
    recursionStack.delete(node);
    return null;
  }

  // Check all nodes
  for (const fieldName of graph.keys()) {
    const cycle = dfs(fieldName);
    if (cycle) {
      return { hasCircular: true, cycle };
    }
  }

  return { hasCircular: false };
}

/**
 * Gets fields that need to be re-evaluated when a specific field changes
 *
 * @param schema - Schema definition
 * @param changedField - Name of field that changed
 * @returns Array of field names that depend on the changed field
 */
export function getFieldsToReevaluate(
  schema: SchemaDefinition,
  changedField: string
): string[] {
  const dependentFields: string[] = [];
  const graph = buildVisibilityDependencyGraph(schema);

  for (const [fieldName, deps] of graph.entries()) {
    if (deps.includes(changedField)) {
      dependentFields.push(fieldName);
    }
  }

  return dependentFields;
}
