/**
 * HOOPERITS CMS - Cross-field Validation Tests (Spec 007)
 *
 * Unit tests for cross-field validation and debounced validation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateField,
  validateCrossFields,
  validateDocument,
  createDebouncedValidator,
  getValidationErrorsByField,
  isDocumentValid,
  getFieldsWithErrors,
} from '../cross-validation';
import { defineSchema } from '../define';
import { text, number, datetime } from '../fields';
import type { SchemaDefinition, ValidationContext } from '../types';

describe('Field-level Validation', () => {
  describe('validateField', () => {
    it('should return undefined for fields without validation', () => {
      const field = text({ label: 'Title' });
      const error = validateField(field, 'title', 'Hello', { title: 'Hello' });
      expect(error).toBeUndefined();
    });

    it('should return error message from validation function', () => {
      const field = number({
        label: 'Price',
        validate: (value) =>
          typeof value === 'number' && value < 0 ? 'Price must be positive' : undefined,
      });
      const error = validateField(field, 'price', -10, { price: -10 });
      expect(error).toBe('Price must be positive');
    });

    it('should return undefined when validation passes', () => {
      const field = number({
        label: 'Price',
        validate: (value) =>
          typeof value === 'number' && value < 0 ? 'Price must be positive' : undefined,
      });
      const error = validateField(field, 'price', 100, { price: 100 });
      expect(error).toBeUndefined();
    });

    it('should provide validation context with document', () => {
      let capturedContext: ValidationContext | undefined;
      const field = text({
        label: 'Slug',
        validate: (_value, context) => {
          capturedContext = context as ValidationContext;
          return undefined;
        },
      });

      validateField(field, 'slug', 'my-slug', { slug: 'my-slug', title: 'My Title' });

      expect(capturedContext).toBeDefined();
      expect(capturedContext!.fieldName).toBe('slug');
      expect(capturedContext!.document).toEqual({ slug: 'my-slug', title: 'My Title' });
    });

    it('should handle validation function errors gracefully', () => {
      const field = text({
        label: 'Test',
        validate: () => {
          throw new Error('Validation error');
        },
      });
      const error = validateField(field, 'test', 'value', { test: 'value' });
      expect(error).toBe('Validation error occurred');
    });
  });
});

describe('Cross-field Validation', () => {
  describe('validateCrossFields', () => {
    it('should return empty array for schemas without validation', () => {
      const schema = defineSchema({
        name: 'simple',
        label: 'Simple',
        fields: {
          title: text({ label: 'Title' }),
        },
      });

      const errors = validateCrossFields(schema, { title: 'Hello' });
      expect(errors).toEqual([]);
    });

    it('should return validation errors from schema validation', () => {
      const schema = defineSchema({
        name: 'event',
        label: 'Event',
        fields: {
          startDate: datetime({ label: 'Start Date' }),
          endDate: datetime({ label: 'End Date' }),
        },
        validation: (doc) => {
          const errors = [];
          if (doc.startDate && doc.endDate && doc.endDate < doc.startDate) {
            errors.push({
              field: 'endDate',
              message: 'End date must be after start date',
            });
          }
          return errors;
        },
      });

      const errors = validateCrossFields(schema, {
        startDate: '2024-01-15',
        endDate: '2024-01-10',
      });

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'endDate',
        message: 'End date must be after start date',
      });
    });

    it('should return multiple errors', () => {
      const schema = defineSchema({
        name: 'event',
        label: 'Event',
        fields: {
          startDate: datetime({ label: 'Start Date' }),
          endDate: datetime({ label: 'End Date' }),
          registrationDeadline: datetime({ label: 'Registration Deadline' }),
        },
        validation: (doc) => {
          const errors = [];
          if (doc.startDate && doc.endDate && doc.endDate < doc.startDate) {
            errors.push({
              field: 'endDate',
              message: 'End date must be after start date',
            });
          }
          if (
            doc.registrationDeadline &&
            doc.startDate &&
            doc.registrationDeadline > doc.startDate
          ) {
            errors.push({
              field: 'registrationDeadline',
              message: 'Registration must close before event starts',
            });
          }
          return errors;
        },
      });

      const errors = validateCrossFields(schema, {
        startDate: '2024-01-15',
        endDate: '2024-01-10',
        registrationDeadline: '2024-01-20',
      });

      expect(errors).toHaveLength(2);
    });

    it('should handle validation function errors gracefully', () => {
      const schema: SchemaDefinition = {
        name: 'error-schema',
        label: 'Error Schema',
        labelPlural: 'Error Schemas',
        fields: {
          title: { type: 'text', options: { label: 'Title' } },
        },
        validation: () => {
          throw new Error('Test error');
        },
      };

      const errors = validateCrossFields(schema, { title: 'Test' });
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('_schema');
    });
  });

  describe('validateDocument', () => {
    it('should combine field-level and cross-field validation', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          price: number({
            label: 'Price',
            validate: (value) =>
              typeof value === 'number' && value < 0 ? 'Price must be positive' : undefined,
          }),
          discountPrice: number({
            label: 'Discount Price',
          }),
        },
        validation: (doc) => {
          const errors = [];
          if (
            typeof doc.discountPrice === 'number' &&
            typeof doc.price === 'number' &&
            doc.discountPrice >= doc.price
          ) {
            errors.push({
              field: 'discountPrice',
              message: 'Discount price must be less than regular price',
            });
          }
          return errors;
        },
      });

      const result = validateDocument(schema, {
        price: -10,
        discountPrice: 100,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errorsByField.get('price')).toContain('Price must be positive');
      expect(result.errorsByField.get('discountPrice')).toContain(
        'Discount price must be less than regular price'
      );
    });

    it('should return valid for documents without errors', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          price: number({
            label: 'Price',
            validate: (value) =>
              typeof value === 'number' && value < 0 ? 'Price must be positive' : undefined,
          }),
        },
      });

      const result = validateDocument(schema, { price: 100 });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('convenience functions', () => {
    const schema = defineSchema({
      name: 'test',
      label: 'Test',
      fields: {
        price: number({
          label: 'Price',
          validate: (value) =>
            typeof value === 'number' && value < 0 ? 'Price must be positive' : undefined,
        }),
        quantity: number({ label: 'Quantity' }),
      },
    });

    it('getValidationErrorsByField should return errors by field', () => {
      const errors = getValidationErrorsByField(schema, { price: -10, quantity: 5 });
      expect(errors.get('price')).toContain('Price must be positive');
      expect(errors.has('quantity')).toBe(false);
    });

    it('isDocumentValid should return true for valid documents', () => {
      expect(isDocumentValid(schema, { price: 100, quantity: 5 })).toBe(true);
    });

    it('isDocumentValid should return false for invalid documents', () => {
      expect(isDocumentValid(schema, { price: -10, quantity: 5 })).toBe(false);
    });

    it('getFieldsWithErrors should return field names with errors', () => {
      const fields = getFieldsWithErrors(schema, { price: -10, quantity: 5 });
      expect(fields).toContain('price');
      expect(fields).not.toContain('quantity');
    });
  });
});

describe('Debounced Validation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce validation calls', () => {
    const schema = defineSchema({
      name: 'test',
      label: 'Test',
      fields: {
        title: text({ label: 'Title' }),
      },
    });

    const onValidated = vi.fn();
    const validator = createDebouncedValidator(schema, {
      delay: 300,
      onValidated,
    });

    // Call multiple times quickly
    validator({ title: 'a' });
    validator({ title: 'ab' });
    validator({ title: 'abc' });

    // Should not have been called yet
    expect(onValidated).not.toHaveBeenCalled();

    // Fast-forward time
    vi.advanceTimersByTime(300);

    // Should have been called once with final value
    expect(onValidated).toHaveBeenCalledTimes(1);
  });

  it('should call onValidating when validation starts', () => {
    const schema = defineSchema({
      name: 'test',
      label: 'Test',
      fields: {
        title: text({ label: 'Title' }),
      },
    });

    const onValidating = vi.fn();
    const validator = createDebouncedValidator(schema, {
      delay: 300,
      onValidating,
    });

    validator({ title: 'test' });

    // onValidating should be called immediately
    expect(onValidating).toHaveBeenCalled();
  });

  it('should provide validation result to onValidated', () => {
    const schema = defineSchema({
      name: 'test',
      label: 'Test',
      fields: {
        price: number({
          label: 'Price',
          validate: (value) =>
            typeof value === 'number' && value < 0 ? 'Price must be positive' : undefined,
        }),
      },
    });

    const onValidated = vi.fn();
    const validator = createDebouncedValidator(schema, {
      delay: 300,
      onValidated,
    });

    validator({ price: -10 });
    vi.advanceTimersByTime(300);

    expect(onValidated).toHaveBeenCalledWith(
      expect.objectContaining({
        isValid: false,
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'price',
            message: 'Price must be positive',
          }),
        ]),
      })
    );
  });

  it('should reset timer on subsequent calls', () => {
    const schema = defineSchema({
      name: 'test',
      label: 'Test',
      fields: {
        title: text({ label: 'Title' }),
      },
    });

    const onValidated = vi.fn();
    const validator = createDebouncedValidator(schema, {
      delay: 300,
      onValidated,
    });

    validator({ title: 'a' });
    vi.advanceTimersByTime(200);

    validator({ title: 'ab' });
    vi.advanceTimersByTime(200);

    // Should not have been called - timer was reset
    expect(onValidated).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    // Now it should have been called
    expect(onValidated).toHaveBeenCalledTimes(1);
  });
});
