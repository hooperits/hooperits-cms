/**
 * HOOPERITS CMS - Schema Validator
 * Generate Zod validators from schema definitions
 */

import { z, ZodSchema, ZodObject, ZodRawShape } from 'zod';
import type { FieldDefinition, SchemaDefinition } from './types';

/**
 * Generate a Zod schema for a single field
 */
function generateFieldValidator(field: FieldDefinition): ZodSchema {
  let validator: ZodSchema;

  switch (field.type) {
    case 'text': {
      let textValidator = z.string();
      if (field.options.minLength !== undefined) {
        textValidator = textValidator.min(field.options.minLength);
      }
      if (field.options.maxLength !== undefined) {
        textValidator = textValidator.max(field.options.maxLength);
      }
      if (field.options.pattern) {
        textValidator = textValidator.regex(new RegExp(field.options.pattern));
      }
      validator = textValidator;
      break;
    }

    case 'richText': {
      // Rich text is stored as JSON (ProseMirror format)
      validator = z.object({
        type: z.literal('doc'),
        content: z.array(z.any()),
      });
      break;
    }

    case 'number': {
      let numValidator = field.options.integer ? z.number().int() : z.number();
      if (field.options.min !== undefined) {
        numValidator = numValidator.min(field.options.min);
      }
      if (field.options.max !== undefined) {
        numValidator = numValidator.max(field.options.max);
      }
      validator = numValidator;
      break;
    }

    case 'boolean': {
      validator = z.boolean();
      break;
    }

    case 'date': {
      validator = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
      break;
    }

    case 'datetime': {
      validator = z.string().datetime();
      break;
    }

    case 'image':
    case 'file': {
      // Media reference (UUID)
      validator = z.string().uuid();
      break;
    }

    case 'slug': {
      let slugValidator = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      if (field.options.maxLength) {
        slugValidator = slugValidator.max(field.options.maxLength);
      }
      validator = slugValidator;
      break;
    }

    case 'reference': {
      if (field.options.many) {
        validator = z.array(z.string().uuid());
      } else {
        validator = z.string().uuid();
      }
      break;
    }

    case 'array': {
      const itemValidator = generateFieldValidator(field.options.of);
      let arrayValidator = z.array(itemValidator);
      if (field.options.min !== undefined) {
        arrayValidator = arrayValidator.min(field.options.min);
      }
      if (field.options.max !== undefined) {
        arrayValidator = arrayValidator.max(field.options.max);
      }
      validator = arrayValidator;
      break;
    }

    case 'select': {
      const values = field.options.options.map((opt) => opt.value);
      const enumValidator = z.enum(values as [string, ...string[]]);
      if (field.options.multiple) {
        validator = z.array(enumValidator);
      } else {
        validator = enumValidator;
      }
      break;
    }

    default: {
      // Fallback for unknown types
      validator = z.any();
    }
  }

  // Handle required/optional and default
  if (!field.options.required) {
    validator = validator.optional();
  }

  if (field.options.default !== undefined) {
    validator = validator.default(field.options.default);
  }

  return validator;
}

/**
 * Generate a Zod validator for a complete schema
 */
export function generateSchemaValidator(schema: SchemaDefinition): ZodObject<ZodRawShape> {
  const shape: ZodRawShape = {};

  for (const [fieldName, field] of Object.entries(schema.fields)) {
    shape[fieldName] = generateFieldValidator(field);
  }

  return z.object(shape);
}

/**
 * Validate content data against a schema
 */
export function validateContent(
  schema: SchemaDefinition,
  data: unknown
): { success: true; data: Record<string, unknown> } | { success: false; errors: z.ZodError } {
  const validator = generateSchemaValidator(schema);
  const result = validator.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data as Record<string, unknown> };
  }

  return { success: false, errors: result.error };
}

/**
 * Cache for generated validators
 */
const validatorCache = new Map<string, ZodObject<ZodRawShape>>();

/**
 * Get or create a cached validator for a schema
 */
export function getSchemaValidator(schema: SchemaDefinition): ZodObject<ZodRawShape> {
  const cached = validatorCache.get(schema.name);
  if (cached) {
    return cached;
  }

  const validator = generateSchemaValidator(schema);
  validatorCache.set(schema.name, validator);
  return validator;
}

/**
 * Clear validator cache (for testing or schema updates)
 */
export function clearValidatorCache(): void {
  validatorCache.clear();
}
