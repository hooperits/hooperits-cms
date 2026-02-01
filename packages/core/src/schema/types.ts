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

// ============================================================================
// Advanced Schema Features - Type Definitions (Spec 007)
// ============================================================================

/**
 * Document context passed to visibility conditions, validators, and computed functions
 */
export type DocumentContext = Record<string, unknown>;

/**
 * Function to determine field visibility based on document values
 * @param doc - Current document state
 * @returns true if field should be hidden, false if visible
 */
export type VisibilityCondition = (doc: DocumentContext) => boolean;

/**
 * Validation context with access to the full document
 */
export interface ValidationContext {
  /** Current document data */
  document: DocumentContext;
  /** Field name being validated */
  fieldName: string;
}

/**
 * Field-level validation function that can access full document context
 * @param value - Current field value
 * @param context - Validation context with document access
 * @returns Error message if invalid, undefined if valid
 */
export type ValidationFunction = (
  value: unknown,
  context: ValidationContext
) => string | undefined;

/**
 * Function to compute field value from document state
 * @param doc - Current document state
 * @returns Computed value for the field
 */
export type ComputedFunction<T = unknown> = (doc: DocumentContext) => T;

/**
 * Warning function that returns a warning message based on document state
 * @param doc - Current document state
 * @returns Warning message to display, or undefined if no warning
 */
export type WarningFunction = (doc: DocumentContext) => string | undefined;

/**
 * Cross-field validation error returned from schema-level validation
 */
export interface ValidationError {
  /** Field name the error relates to */
  field: string;
  /** Human-readable error message */
  message: string;
}

/**
 * Schema-level validation function for cross-field validation
 * @param doc - Current document state
 * @returns Array of validation errors, empty array if valid
 */
export type SchemaValidationFunction = (doc: DocumentContext) => ValidationError[];

/**
 * Visual field group for organizing form fields
 */
export interface FieldGroup {
  /** Unique group identifier */
  name: string;
  /** Display title for the group */
  title: string;
  /** Optional description shown below the title */
  description?: string;
  /** Whether the group can be collapsed (accordion/default modes) */
  collapsible?: boolean;
  /** Initial collapsed state (only used if collapsible is true) */
  collapsed?: boolean;
}

/**
 * Layout mode for displaying field groups
 * - 'default': Groups render as sections with headers
 * - 'tabs': Each group is a tab
 * - 'accordion': Each group is a collapsible section
 */
export type LayoutMode = 'default' | 'tabs' | 'accordion';

// ============================================================================
// Base Field Options
// ============================================================================

// Base field options
export interface BaseFieldOptions {
  /** Display label for the field */
  label: string;
  /** Brief description shown in the form */
  description?: string;
  /** Whether the field is required */
  required?: boolean;
  /**
   * Hide the field - can be a boolean or a function for conditional visibility
   * When function: receives current document, returns true to hide
   */
  hidden?: boolean | VisibilityCondition;
  /** Whether the field is read-only (cannot be edited) */
  readOnly?: boolean;
  /** Default value for the field */
  default?: unknown;
  // --- Advanced Schema Features (Spec 007) ---
  /** Group name to assign this field to (for tabs/accordion layouts) */
  group?: string;
  /** Short help text displayed below the field */
  helpText?: string;
  /** Extended help content shown in tooltip on info icon hover */
  tooltip?: string;
  /** Placeholder text for empty input fields */
  placeholder?: string;
  /**
   * Warning message - can be static string or dynamic function
   * Warnings are displayed but don't block saving
   */
  warning?: string | WarningFunction;
  /**
   * Custom validation function with access to full document
   * Return error message if invalid, undefined if valid
   */
  validate?: ValidationFunction;
  /**
   * Computed field function - field becomes read-only and auto-calculated
   * Receives current document, returns computed value
   */
  computed?: ComputedFunction;
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

/**
 * Dynamic options function for dependent selects
 * @param doc - Current document state
 * @param parentValue - Value of the parent field (convenience)
 * @returns Array of options or Promise for async loading
 */
export type DynamicOptionsFunction = (
  doc: DocumentContext,
  parentValue: unknown
) => Array<{ value: string; label: string }> | Promise<Array<{ value: string; label: string }>>;

/**
 * Dependency configuration for select fields
 */
export interface SelectDependency {
  /** Name of the parent field this select depends on */
  field: string;
  /** Function to get options based on parent value */
  getOptions: DynamicOptionsFunction;
  /** Optional API endpoint to fetch options (alternative to getOptions) */
  endpoint?: string;
  /** Whether to clear value when parent changes and current value is invalid */
  clearOnChange?: boolean;
}

// Select field options
export interface SelectFieldOptions extends BaseFieldOptions {
  /** Static options for the select */
  options: Array<{ value: string; label: string }>;
  /** Allow multiple selection */
  multiple?: boolean;
  /** Dependency configuration for dynamic options (Spec 007) */
  dependsOn?: SelectDependency;
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
  /** Unique schema identifier */
  name: string;
  /** Singular display label */
  label: string;
  /** Plural display label */
  labelPlural: string;
  /** Optional icon identifier */
  icon?: string;
  /** Field definitions */
  fields: Record<string, FieldDefinition>;
  // --- Advanced Schema Features (Spec 007) ---
  /** Field groups for visual organization */
  groups?: FieldGroup[];
  /** Layout mode for displaying groups */
  layout?: LayoutMode;
  /** Schema-level cross-field validation function */
  validation?: SchemaValidationFunction;
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
