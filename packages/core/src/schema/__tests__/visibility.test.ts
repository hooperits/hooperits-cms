/**
 * HOOPERITS CMS - Field Visibility Tests (Spec 007)
 *
 * Unit tests for visibility evaluation and circular dependency detection.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateFieldVisibility,
  evaluateAllFieldVisibility,
  getVisibilityDependencies,
  buildVisibilityDependencyGraph,
  detectCircularDependencies,
  getFieldsToReevaluate,
} from '../visibility';
import { defineSchema } from '../define';
import { text, boolean, number } from '../fields';

describe('Field Visibility', () => {
  describe('evaluateFieldVisibility', () => {
    it('should return false for fields without hidden property', () => {
      const field = text({ label: 'Name' });
      const isHidden = evaluateFieldVisibility(field, {});
      expect(isHidden).toBe(false);
    });

    it('should return true for fields with hidden: true', () => {
      const field = text({ label: 'Name', hidden: true });
      const isHidden = evaluateFieldVisibility(field, {});
      expect(isHidden).toBe(true);
    });

    it('should return false for fields with hidden: false', () => {
      const field = text({ label: 'Name', hidden: false });
      const isHidden = evaluateFieldVisibility(field, {});
      expect(isHidden).toBe(false);
    });

    it('should evaluate function-based hidden condition', () => {
      const field = text({
        label: 'Discount',
        hidden: (doc) => !doc.hasDiscount,
      });

      expect(evaluateFieldVisibility(field, { hasDiscount: false })).toBe(true);
      expect(evaluateFieldVisibility(field, { hasDiscount: true })).toBe(false);
    });

    it('should handle errors in visibility function gracefully', () => {
      const field = text({
        label: 'Discount',
        hidden: () => {
          throw new Error('Test error');
        },
      });

      // Should return false (visible) on error
      const isHidden = evaluateFieldVisibility(field, {});
      expect(isHidden).toBe(false);
    });
  });

  describe('evaluateAllFieldVisibility', () => {
    it('should evaluate visibility for all fields', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          title: text({ label: 'Title' }),
          hasDiscount: boolean({ label: 'Has Discount' }),
          discountPercent: number({
            label: 'Discount %',
            hidden: (doc) => !doc.hasDiscount,
          }),
        },
      });

      const result = evaluateAllFieldVisibility(schema, { hasDiscount: false });

      expect(result.hiddenFields.get('title')).toBe(false);
      expect(result.hiddenFields.get('hasDiscount')).toBe(false);
      expect(result.hiddenFields.get('discountPercent')).toBe(true);
    });

    it('should detect fields needing cleanup on visibility transition', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          hasDiscount: boolean({ label: 'Has Discount' }),
          discountPercent: number({
            label: 'Discount %',
            hidden: (doc) => !doc.hasDiscount,
          }),
        },
      });

      // Previous state: field was visible
      const previousState = new Map<string, boolean>();
      previousState.set('hasDiscount', false);
      previousState.set('discountPercent', false);

      // Current state: hasDiscount is false, field has value
      const result = evaluateAllFieldVisibility(
        schema,
        { hasDiscount: false, discountPercent: 20 },
        previousState
      );

      expect(result.fieldsNeedingCleanup).toContain('discountPercent');
    });

    it('should not flag fields without values for cleanup', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          hasDiscount: boolean({ label: 'Has Discount' }),
          discountPercent: number({
            label: 'Discount %',
            hidden: (doc) => !doc.hasDiscount,
          }),
        },
      });

      const previousState = new Map<string, boolean>();
      previousState.set('discountPercent', false);

      // Field has no value
      const result = evaluateAllFieldVisibility(
        schema,
        { hasDiscount: false },
        previousState
      );

      expect(result.fieldsNeedingCleanup).not.toContain('discountPercent');
    });
  });

  describe('getVisibilityDependencies', () => {
    it('should extract dependencies from dot notation', () => {
      const condition = (doc: Record<string, unknown>) => !doc.hasDiscount;
      const deps = getVisibilityDependencies(condition);
      expect(deps).toContain('hasDiscount');
    });

    it('should extract dependencies from bracket notation', () => {
      const condition = (doc: Record<string, unknown>) => !doc['hasDiscount'];
      const deps = getVisibilityDependencies(condition);
      expect(deps).toContain('hasDiscount');
    });

    it('should extract multiple dependencies', () => {
      const condition = (doc: Record<string, unknown>): boolean =>
        doc.type === 'sale' && Boolean(doc.hasDiscount);
      const deps = getVisibilityDependencies(condition);
      expect(deps).toContain('type');
      expect(deps).toContain('hasDiscount');
    });

    it('should not duplicate dependencies', () => {
      const condition = (doc: Record<string, unknown>): boolean =>
        Boolean(doc.hasDiscount) || !doc.hasDiscount;
      const deps = getVisibilityDependencies(condition);
      expect(deps.filter((d) => d === 'hasDiscount').length).toBe(1);
    });
  });

  describe('buildVisibilityDependencyGraph', () => {
    it('should build dependency graph for schema', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          hasDiscount: boolean({ label: 'Has Discount' }),
          discountPercent: number({
            label: 'Discount %',
            hidden: (doc) => !doc.hasDiscount,
          }),
          discountEndDate: text({
            label: 'End Date',
            hidden: (doc) => !doc.hasDiscount,
          }),
        },
      });

      const graph = buildVisibilityDependencyGraph(schema);

      expect(graph.get('hasDiscount')).toEqual([]);
      expect(graph.get('discountPercent')).toContain('hasDiscount');
      expect(graph.get('discountEndDate')).toContain('hasDiscount');
    });
  });

  describe('getFieldsToReevaluate', () => {
    it('should return fields that depend on changed field', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          hasDiscount: boolean({ label: 'Has Discount' }),
          discountPercent: number({
            label: 'Discount %',
            hidden: (doc) => !doc.hasDiscount,
          }),
          regularPrice: number({ label: 'Price' }),
        },
      });

      const toReevaluate = getFieldsToReevaluate(schema, 'hasDiscount');

      expect(toReevaluate).toContain('discountPercent');
      expect(toReevaluate).not.toContain('regularPrice');
    });
  });
});

describe('Circular Dependency Detection', () => {
  it('should detect no circular dependencies in valid schema', () => {
    const schema = defineSchema({
      name: 'product',
      label: 'Product',
      fields: {
        hasDiscount: boolean({ label: 'Has Discount' }),
        discountPercent: number({
          label: 'Discount %',
          hidden: (doc) => !doc.hasDiscount,
        }),
      },
    });

    const check = detectCircularDependencies(schema);
    expect(check.hasCircular).toBe(false);
    expect(check.cycle).toBeUndefined();
  });

  it('should detect simple circular dependency A -> B -> A', () => {
    // We need to test the detection function directly since defineSchema throws
    // Create a mock schema bypassing validation
    const mockSchema = {
      name: 'test',
      label: 'Test',
      labelPlural: 'Tests',
      fields: {
        fieldA: {
          type: 'boolean' as const,
          options: {
            label: 'Field A',
            hidden: (doc: Record<string, unknown>): boolean => !doc.fieldB,
          },
        },
        fieldB: {
          type: 'boolean' as const,
          options: {
            label: 'Field B',
            hidden: (doc: Record<string, unknown>): boolean => !doc.fieldA,
          },
        },
      },
    };

    const check = detectCircularDependencies(mockSchema);
    expect(check.hasCircular).toBe(true);
    expect(check.cycle).toBeDefined();
    expect(check.cycle?.length).toBeGreaterThan(1);
  });

  it('should throw error in defineSchema for circular dependencies', () => {
    expect(() =>
      defineSchema({
        name: 'circular',
        label: 'Circular',
        fields: {
          fieldA: {
            type: 'boolean',
            options: {
              label: 'Field A',
              hidden: (doc: Record<string, unknown>): boolean => !doc.fieldB,
            },
          },
          fieldB: {
            type: 'boolean',
            options: {
              label: 'Field B',
              hidden: (doc: Record<string, unknown>): boolean => !doc.fieldA,
            },
          },
        } as Record<string, { type: 'boolean'; options: { label: string; hidden: (doc: Record<string, unknown>) => boolean } }>,
      })
    ).toThrow('Circular dependency');
  });
});
