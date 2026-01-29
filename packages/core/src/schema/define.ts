/**
 * HOOPERITS CMS - Schema Definition
 * defineSchema function for creating content type schemas
 */

import type { SchemaDefinition, FieldDefinition } from './types';

export interface DefineSchemaInput {
  name: string;
  label: string;
  labelPlural?: string;
  icon?: string;
  fields: Record<string, FieldDefinition>;
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

  return {
    name: input.name,
    label: input.label,
    labelPlural: input.labelPlural || `${input.label}s`,
    icon: input.icon,
    fields: input.fields,
  };
}
