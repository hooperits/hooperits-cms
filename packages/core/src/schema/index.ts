/**
 * HOOPERITS CMS - Schema Module
 * Public API for schema definitions
 */

// Types
export type {
  FieldType,
  BaseFieldOptions,
  TextFieldOptions,
  RichTextFieldOptions,
  NumberFieldOptions,
  BooleanFieldOptions,
  DateFieldOptions,
  DateTimeFieldOptions,
  ImageFieldOptions,
  FileFieldOptions,
  SlugFieldOptions,
  ReferenceFieldOptions,
  ArrayFieldOptions,
  SelectFieldOptions,
  PortableTextFieldOptions,
  PortableTextAnnotationConfig,
  PortableTextBlockConfig,
  PortableTextInlineConfig,
  FieldDefinition,
  SchemaDefinition,
  ContentTypeRecord,
  // Advanced Schema Features (Spec 007)
  DocumentContext,
  VisibilityCondition,
  ValidationContext,
  ValidationFunction,
  ComputedFunction,
  WarningFunction,
  ValidationError,
  SchemaValidationFunction,
  FieldGroup,
  LayoutMode,
  DynamicOptionsFunction,
  SelectDependency,
} from './types';

export { FIELD_TYPES } from './types';

// Field helpers
export { fields } from './fields';
export {
  text,
  richText,
  number,
  boolean,
  date,
  datetime,
  image,
  file,
  slug,
  generateSlug,
  reference,
  array,
  select,
  portableText,
} from './fields';

// Schema definition
export { defineSchema } from './define';
export type { DefineSchemaInput } from './define';

// Registry
export {
  registerSchemas,
  getSchemaRegistry,
  getSchema,
  getAllSchemas,
  clearSchemaRegistry,
  SchemaRegistry,
} from './registry';

// Validation
export {
  generateSchemaValidator,
  validateContent,
  getSchemaValidator,
  clearValidatorCache,
} from './validator';

// Sync
export {
  syncSchemas,
  getContentType,
  getAllContentTypes,
  deleteOrphanedTypes,
} from './sync';
export type { SyncResult } from './sync';

// Advanced Schema Features - Visibility (Spec 007)
export {
  evaluateFieldVisibility,
  evaluateAllFieldVisibility,
  getVisibilityDependencies,
  buildVisibilityDependencyGraph,
  detectCircularDependencies,
  getFieldsToReevaluate,
} from './visibility';
export type {
  FieldVisibilityResult,
  VisibilityEvaluationResult,
  CircularDependencyCheck,
} from './visibility';

// Advanced Schema Features - Cross-field Validation (Spec 007)
export {
  validateField,
  validateCrossFields,
  validateDocument,
  createDebouncedValidator,
  getValidationErrorsByField,
  isDocumentValid,
  getFieldsWithErrors,
} from './cross-validation';
export type {
  CrossValidationResult,
  DebouncedValidatorConfig,
} from './cross-validation';

// Advanced Schema Features - Computed Fields (Spec 007)
export {
  isComputedField,
  getComputedFields,
  getComputedDependencies,
  buildComputedDependencyGraph,
  detectComputedCircularDependencies,
  getComputationOrder,
  calculateComputedField,
  calculateComputedFields,
  getFieldsToRecalculate,
} from './computed';
export type {
  ComputedFieldsResult,
  ComputedFieldDependency,
  ComputedCircularCheck,
} from './computed';

// Advanced Schema Features - Field Groups (Spec 007)
export {
  groupFieldsByGroup,
  getFieldGroup,
  getFieldsInGroup,
  groupHasErrors,
  getGroupsWithErrors,
} from './groups';
export type {
  FieldWithName,
  GroupedFields,
  GroupFieldsResult,
} from './groups';
