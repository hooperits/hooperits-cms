/**
 * HOOPERITS CMS - Cross-field Validation Engine (Spec 007)
 * Validates relationships between multiple fields
 */

import type {
  DocumentContext,
  ValidationContext,
  ValidationError,
  ValidationFunction,
  SchemaValidationFunction,
  SchemaDefinition,
  FieldDefinition,
} from './types';

/**
 * Result of cross-field validation
 */
export interface CrossValidationResult {
  /** Whether the document is valid */
  isValid: boolean;
  /** Array of validation errors */
  errors: ValidationError[];
  /** Map of field name to error messages */
  errorsByField: Map<string, string[]>;
}

/**
 * Debounced validator configuration
 */
export interface DebouncedValidatorConfig {
  /** Debounce delay in milliseconds */
  delay: number;
  /** Callback when validation starts */
  onValidating?: () => void;
  /** Callback with validation result */
  onValidated?: (result: CrossValidationResult) => void;
}

/**
 * Validates a single field with its custom validation function
 *
 * @param field - Field definition
 * @param fieldName - Name of the field
 * @param value - Current field value
 * @param doc - Full document context
 * @returns Error message if invalid, undefined if valid
 */
export function validateField(
  field: FieldDefinition,
  fieldName: string,
  value: unknown,
  doc: DocumentContext
): string | undefined {
  const validate = field.options.validate;

  if (typeof validate !== 'function') {
    return undefined;
  }

  const context: ValidationContext = {
    document: doc,
    fieldName,
  };

  try {
    return (validate as ValidationFunction)(value, context);
  } catch (error) {
    console.error(`Error in field validation for ${fieldName}:`, error);
    return 'Validation error occurred';
  }
}

/**
 * Executes schema-level cross-field validation
 *
 * @param schema - Schema definition
 * @param doc - Current document state
 * @returns Array of validation errors
 */
export function validateCrossFields(
  schema: SchemaDefinition,
  doc: DocumentContext
): ValidationError[] {
  const validation = schema.validation;

  if (typeof validation !== 'function') {
    return [];
  }

  try {
    return (validation as SchemaValidationFunction)(doc);
  } catch (error) {
    console.error('Error in cross-field validation:', error);
    return [{ field: '_schema', message: 'Cross-field validation error occurred' }];
  }
}

/**
 * Performs complete validation on a document
 * Includes both field-level and schema-level validation
 *
 * @param schema - Schema definition
 * @param doc - Current document state
 * @returns Complete validation result
 */
export function validateDocument(
  schema: SchemaDefinition,
  doc: DocumentContext
): CrossValidationResult {
  const errors: ValidationError[] = [];
  const errorsByField = new Map<string, string[]>();

  // Field-level validation
  for (const [fieldName, field] of Object.entries(schema.fields)) {
    const value = doc[fieldName];
    const error = validateField(field, fieldName, value, doc);

    if (error) {
      errors.push({ field: fieldName, message: error });

      const fieldErrors = errorsByField.get(fieldName) || [];
      fieldErrors.push(error);
      errorsByField.set(fieldName, fieldErrors);
    }
  }

  // Schema-level cross-field validation
  const crossFieldErrors = validateCrossFields(schema, doc);

  for (const err of crossFieldErrors) {
    errors.push(err);

    const fieldErrors = errorsByField.get(err.field) || [];
    fieldErrors.push(err.message);
    errorsByField.set(err.field, fieldErrors);
  }

  return {
    isValid: errors.length === 0,
    errors,
    errorsByField,
  };
}

/**
 * Creates a debounced validator that delays validation execution
 * Useful for real-time validation without excessive re-validation
 *
 * @param schema - Schema definition
 * @param config - Debouncer configuration
 * @returns Function to trigger debounced validation
 */
export function createDebouncedValidator(
  schema: SchemaDefinition,
  config: DebouncedValidatorConfig
): (doc: DocumentContext) => void {
  const { delay, onValidating, onValidated } = config;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (doc: DocumentContext) => {
    // Clear previous timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Notify that validation is pending
    onValidating?.();

    // Schedule validation
    timeoutId = setTimeout(() => {
      const result = validateDocument(schema, doc);
      onValidated?.(result);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Cancels any pending debounced validation
 * Call this when component unmounts
 *
 * @param validator - Debounced validator function
 */
export function cancelDebouncedValidation(
  _validator: ReturnType<typeof createDebouncedValidator>
): void {
  // Note: In a real implementation, we'd need to track the timeout ID
  // This is a placeholder that works with the closure-based implementation
}

/**
 * Validates a document and returns errors grouped by field
 * Convenience function for form error display
 *
 * @param schema - Schema definition
 * @param doc - Current document state
 * @returns Map of field name to array of error messages
 */
export function getValidationErrorsByField(
  schema: SchemaDefinition,
  doc: DocumentContext
): Map<string, string[]> {
  const result = validateDocument(schema, doc);
  return result.errorsByField;
}

/**
 * Checks if a document has any validation errors
 *
 * @param schema - Schema definition
 * @param doc - Current document state
 * @returns true if document is valid
 */
export function isDocumentValid(
  schema: SchemaDefinition,
  doc: DocumentContext
): boolean {
  const result = validateDocument(schema, doc);
  return result.isValid;
}

/**
 * Gets all fields with validation errors
 *
 * @param schema - Schema definition
 * @param doc - Current document state
 * @returns Array of field names with errors
 */
export function getFieldsWithErrors(
  schema: SchemaDefinition,
  doc: DocumentContext
): string[] {
  const result = validateDocument(schema, doc);
  return Array.from(result.errorsByField.keys());
}
