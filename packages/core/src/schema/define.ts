/**
 * HOOPERITS CMS - Schema Definition
 * defineSchema function for creating content type schemas
 */

import type {
  SchemaDefinition,
  FieldDefinition,
  FieldGroup,
  LayoutMode,
  SchemaValidationFunction,
} from './types';
import { detectCircularDependencies } from './visibility';
import { detectComputedCircularDependencies } from './computed';

export interface DefineSchemaInput {
  name: string;
  label: string;
  labelPlural?: string;
  icon?: string;
  fields: Record<string, FieldDefinition>;
  /** Field groups for visual organization (Spec 007) */
  groups?: FieldGroup[];
  /** Layout mode for displaying groups (Spec 007) */
  layout?: LayoutMode;
  /** Schema-level cross-field validation function (Spec 007) */
  validation?: SchemaValidationFunction;
}

/**
 * Define a content type schema
 * @param input Schema definition input
 * @returns Complete schema definition
 */
export function defineSchema(input: DefineSchemaInput): SchemaDefinition {
  // Validate name (lowercase, alphanumeric, hyphens)
  if (!/^[a-z][a-z0-9-]*$/.test(input.name)) {
    throw new Error(
      `Invalid schema name '${input.name}'. Must start with lowercase letter and contain only lowercase letters, numbers, and hyphens.`
    );
  }

  // Validate fields
  if (!input.fields || Object.keys(input.fields).length === 0) {
    throw new Error(`Schema '${input.name}' must have at least one field.`);
  }

  // Validate field names
  for (const fieldName of Object.keys(input.fields)) {
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(fieldName)) {
      throw new Error(
        `Invalid field name '${fieldName}' in schema '${input.name}'. Field names must start with a letter and contain only letters and numbers.`
      );
    }
  }

  // Build initial schema for validation
  const schema: SchemaDefinition = {
    name: input.name,
    label: input.label,
    labelPlural: input.labelPlural || `${input.label}s`,
    icon: input.icon,
    fields: input.fields,
    groups: input.groups,
    layout: input.layout,
    validation: input.validation,
  };

  // Validate group references (Spec 007 - T020)
  if (input.groups && input.groups.length > 0) {
    validateGroupReferences(schema);
    validateGroupDefinitions(input.groups, input.name);
  }

  // Validate layout mode
  if (input.layout && !['default', 'tabs', 'accordion'].includes(input.layout)) {
    throw new Error(
      `Invalid layout mode '${input.layout}' in schema '${input.name}'. Must be 'default', 'tabs', or 'accordion'.`
    );
  }

  // Check for circular dependencies in visibility conditions (Spec 007 - T021)
  const visibilityCheck = detectCircularDependencies(schema);
  if (visibilityCheck.hasCircular) {
    throw new Error(
      `Circular dependency detected in visibility conditions for schema '${input.name}': ${visibilityCheck.cycle?.join(' -> ')}`
    );
  }

  // Check for circular dependencies in computed fields (Spec 007 - T021)
  const computedCheck = detectComputedCircularDependencies(schema);
  if (computedCheck.hasCircular) {
    throw new Error(
      `Circular dependency detected in computed fields for schema '${input.name}': ${computedCheck.cycle?.join(' -> ')}`
    );
  }

  return schema;
}

/**
 * Validates that all field group references point to existing groups
 */
function validateGroupReferences(schema: SchemaDefinition): void {
  if (!schema.groups) return;

  const groupNames = new Set(schema.groups.map((g) => g.name));

  for (const [fieldName, field] of Object.entries(schema.fields)) {
    const group = field.options.group;
    if (group && !groupNames.has(group)) {
      throw new Error(
        `Field '${fieldName}' in schema '${schema.name}' references non-existent group '${group}'. ` +
        `Available groups: ${Array.from(groupNames).join(', ')}`
      );
    }
  }
}

/**
 * Validates group definitions
 */
function validateGroupDefinitions(groups: FieldGroup[], schemaName: string): void {
  const names = new Set<string>();

  for (const group of groups) {
    // Check for duplicate group names
    if (names.has(group.name)) {
      throw new Error(
        `Duplicate group name '${group.name}' in schema '${schemaName}'.`
      );
    }
    names.add(group.name);

    // Validate group name format
    if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(group.name)) {
      throw new Error(
        `Invalid group name '${group.name}' in schema '${schemaName}'. ` +
        `Group names must start with a letter and contain only letters, numbers, hyphens, and underscores.`
      );
    }

    // Validate title is present
    if (!group.title || group.title.trim() === '') {
      throw new Error(
        `Group '${group.name}' in schema '${schemaName}' must have a non-empty title.`
      );
    }
  }
}
