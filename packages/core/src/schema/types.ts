/**
 * HOOPERITS CMS - Schema Types
 * Type definitions for schema fields and content types
 */

export const FIELD_TYPES = [
  'text',
  'richText',
  'portableText',
  'number',
  'boolean',
  'date',
  'datetime',
  'image',
  'file',
  'slug',
  'reference',
  'array',
  'select',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

// Base field options
export interface BaseFieldOptions {
  label: string;
  description?: string;
  required?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  default?: unknown;
}

// Text field options
export interface TextFieldOptions extends BaseFieldOptions {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  placeholder?: string;
}

// Rich text field options (legacy - use PortableTextFieldOptions for new projects)
export interface RichTextFieldOptions extends BaseFieldOptions {
  allowImages?: boolean;
  allowLinks?: boolean;
  allowLists?: boolean;
  allowHeadings?: boolean;
}

// Portable Text field options
export interface PortableTextFieldOptions extends BaseFieldOptions {
  /** Allowed block styles */
  styles?: Array<'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'blockquote'>;
  /** Allowed list types */
  lists?: Array<'bullet' | 'number'>;
  /** Allowed text decorators */
  decorators?: Array<'strong' | 'em' | 'underline' | 'strike' | 'code'>;
  /** Annotation types (links, comments, etc.) */
  annotations?: PortableTextAnnotationConfig[];
  /** Custom block types */
  blocks?: PortableTextBlockConfig[];
  /** Custom inline object types */
  inlineObjects?: PortableTextInlineConfig[];
  /** Maximum number of blocks */
  maxBlocks?: number;
  /** Minimum number of blocks (for required fields) */
  minBlocks?: number;
  /** Placeholder text */
  placeholder?: string;
}

// Annotation configuration for Portable Text
export interface PortableTextAnnotationConfig {
  type: string;
  title: string;
  icon?: string;
  fields: Record<string, FieldDefinition>;
}

// Block configuration for Portable Text
export interface PortableTextBlockConfig {
  type: string;
  title: string;
  icon?: string;
  fields: Record<string, FieldDefinition>;
  preview?: {
    select: Record<string, string>;
    prepare: (selection: Record<string, unknown>) => {
      title: string;
      subtitle?: string;
    };
  };
}

// Inline object configuration for Portable Text
export interface PortableTextInlineConfig {
  type: string;
  title: string;
  icon?: string;
  fields: Record<string, FieldDefinition>;
}

// Number field options
export interface NumberFieldOptions extends BaseFieldOptions {
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
}

// Boolean field options
export interface BooleanFieldOptions extends BaseFieldOptions {
  default?: boolean;
}

// Date field options
export interface DateFieldOptions extends BaseFieldOptions {
  min?: string; // ISO date string
  max?: string; // ISO date string
}

// DateTime field options
export interface DateTimeFieldOptions extends BaseFieldOptions {
  min?: string; // ISO datetime string
  max?: string; // ISO datetime string
}

// Image field options
export interface ImageFieldOptions extends BaseFieldOptions {
  maxSize?: number; // bytes
  accept?: string[]; // MIME types
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

// File field options
export interface FileFieldOptions extends BaseFieldOptions {
  maxSize?: number; // bytes
  accept?: string[]; // MIME types or extensions
}

// Slug field options
export interface SlugFieldOptions extends BaseFieldOptions {
  from?: string; // Source field name
  maxLength?: number;
}

// Reference field options
export interface ReferenceFieldOptions extends BaseFieldOptions {
  to: string; // Referenced content type name
  many?: boolean;
}

// Array field options
export interface ArrayFieldOptions extends BaseFieldOptions {
  of: FieldDefinition;
  min?: number;
  max?: number;
}

// Select field options
export interface SelectFieldOptions extends BaseFieldOptions {
  options: Array<{ value: string; label: string }>;
  multiple?: boolean;
}

// Field definition union type
export type FieldDefinition =
  | { type: 'text'; options: TextFieldOptions }
  | { type: 'richText'; options: RichTextFieldOptions }
  | { type: 'portableText'; options: PortableTextFieldOptions }
  | { type: 'number'; options: NumberFieldOptions }
  | { type: 'boolean'; options: BooleanFieldOptions }
  | { type: 'date'; options: DateFieldOptions }
  | { type: 'datetime'; options: DateTimeFieldOptions }
  | { type: 'image'; options: ImageFieldOptions }
  | { type: 'file'; options: FileFieldOptions }
  | { type: 'slug'; options: SlugFieldOptions }
  | { type: 'reference'; options: ReferenceFieldOptions }
  | { type: 'array'; options: ArrayFieldOptions }
  | { type: 'select'; options: SelectFieldOptions };

// Schema definition
export interface SchemaDefinition {
  name: string;
  label: string;
  labelPlural: string;
  icon?: string;
  fields: Record<string, FieldDefinition>;
}

// Content type as stored in database
export interface ContentTypeRecord {
  id: string;
  name: string;
  label: string;
  labelPlural: string;
  schema: {
    fields: Record<string, FieldDefinition>;
  };
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
}
