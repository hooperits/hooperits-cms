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
