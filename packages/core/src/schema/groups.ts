/**
 * HOOPERITS CMS - Field Groups Utility (Spec 007)
 * Utilities for organizing fields into groups
 */

import type { FieldDefinition, FieldGroup, SchemaDefinition } from './types';

/**
 * A field with its name for group organization
 */
export interface FieldWithName {
  name: string;
  field: FieldDefinition;
}

/**
 * A group with its assigned fields
 */
export interface GroupedFields {
  group: FieldGroup;
  fields: FieldWithName[];
}

/**
 * Result of grouping fields by group
 */
export interface GroupFieldsResult {
  /** Fields organized by group */
  groups: GroupedFields[];
  /** Fields without a group assignment */
  ungroupedFields: FieldWithName[];
  /** Whether the schema has any groups defined */
  hasGroups: boolean;
}

/**
 * Groups fields by their group assignment
 *
 * @param schema - Schema definition with groups and fields
 * @returns Grouped fields and ungrouped fields
 */
export function groupFieldsByGroup(schema: SchemaDefinition): GroupFieldsResult {
  const groups = schema.groups || [];
  const hasGroups = groups.length > 0;

  if (!hasGroups) {
    // No groups defined - all fields are ungrouped
    const ungroupedFields: FieldWithName[] = Object.entries(schema.fields).map(
      ([name, field]) => ({ name, field })
    );
    return {
      groups: [],
      ungroupedFields,
      hasGroups: false,
    };
  }

  // Create a map of group name to GroupedFields
  const groupMap = new Map<string, GroupedFields>();
  for (const group of groups) {
    groupMap.set(group.name, { group, fields: [] });
  }

  const ungroupedFields: FieldWithName[] = [];

  // Assign each field to its group
  for (const [name, field] of Object.entries(schema.fields)) {
    const groupName = field.options.group;

    if (groupName && groupMap.has(groupName)) {
      groupMap.get(groupName)!.fields.push({ name, field });
    } else {
      ungroupedFields.push({ name, field });
    }
  }

  // Return groups in their defined order
  const orderedGroups: GroupedFields[] = groups.map((group) => groupMap.get(group.name)!);

  return {
    groups: orderedGroups,
    ungroupedFields,
    hasGroups: true,
  };
}

/**
 * Gets the group that a field belongs to
 *
 * @param schema - Schema definition
 * @param fieldName - Name of the field
 * @returns The group the field belongs to, or undefined
 */
export function getFieldGroup(
  schema: SchemaDefinition,
  fieldName: string
): FieldGroup | undefined {
  const field = schema.fields[fieldName];
  if (!field?.options.group || !schema.groups) {
    return undefined;
  }

  return schema.groups.find((g) => g.name === field.options.group);
}

/**
 * Gets all fields in a specific group
 *
 * @param schema - Schema definition
 * @param groupName - Name of the group
 * @returns Array of field names in the group
 */
export function getFieldsInGroup(
  schema: SchemaDefinition,
  groupName: string
): string[] {
  return Object.entries(schema.fields)
    .filter(([, field]) => field.options.group === groupName)
    .map(([name]) => name);
}

/**
 * Checks if a group has any validation errors
 *
 * @param schema - Schema definition
 * @param groupName - Name of the group
 * @param errors - Map of field names to error status
 * @returns true if any field in the group has an error
 */
export function groupHasErrors(
  schema: SchemaDefinition,
  groupName: string,
  errors: Map<string, boolean> | Record<string, boolean>
): boolean {
  const fieldsInGroup = getFieldsInGroup(schema, groupName);

  for (const fieldName of fieldsInGroup) {
    const hasError = errors instanceof Map
      ? errors.get(fieldName)
      : errors[fieldName];

    if (hasError) {
      return true;
    }
  }

  return false;
}

/**
 * Gets groups that have errors
 *
 * @param schema - Schema definition
 * @param errors - Map of field names to error status
 * @returns Array of group names with errors
 */
export function getGroupsWithErrors(
  schema: SchemaDefinition,
  errors: Map<string, boolean> | Record<string, boolean>
): string[] {
  if (!schema.groups) {
    return [];
  }

  return schema.groups
    .filter((group) => groupHasErrors(schema, group.name, errors))
    .map((group) => group.name);
}
