/**
 * HOOPERITS CMS - Computed Fields Tests (Spec 007)
 *
 * Unit tests for computed field calculation and dependency management.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  isComputedField,
  getComputedFields,
  getComputedDependencies,
  buildComputedDependencyGraph,
  detectComputedCircularDependencies,
  getComputationOrder,
  calculateComputedField,
  calculateComputedFields,
  getFieldsToRecalculate,
} from '../computed';
import { defineSchema } from '../define';
import { text, number, boolean } from '../fields';

describe('Computed Fields', () => {
  describe('isComputedField', () => {
    it('should return true for fields with computed function', () => {
      const field = number({
        label: 'Total',
        computed: (doc) => (doc.price as number) * (doc.quantity as number),
      });
      expect(isComputedField(field)).toBe(true);
    });

    it('should return false for fields without computed function', () => {
      const field = number({ label: 'Price' });
      expect(isComputedField(field)).toBe(false);
    });

    it('should return false for fields with undefined computed', () => {
      const field = text({ label: 'Name' });
      expect(isComputedField(field)).toBe(false);
    });
  });

  describe('getComputedFields', () => {
    it('should return all computed fields from schema', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          price: number({ label: 'Price' }),
          quantity: number({ label: 'Quantity' }),
          total: number({
            label: 'Total',
            computed: (doc) => (doc.price as number) * (doc.quantity as number),
          }),
          discountedTotal: number({
            label: 'Discounted',
            computed: (doc) => (doc.total as number) * 0.9,
          }),
        },
      });

      const computed = getComputedFields(schema);
      expect(computed.length).toBe(2);
      expect(computed.map(([name]) => name)).toContain('total');
      expect(computed.map(([name]) => name)).toContain('discountedTotal');
    });

    it('should return empty array when no computed fields exist', () => {
      const schema = defineSchema({
        name: 'simple',
        label: 'Simple',
        fields: {
          name: text({ label: 'Name' }),
          price: number({ label: 'Price' }),
        },
      });

      const computed = getComputedFields(schema);
      expect(computed.length).toBe(0);
    });
  });

  describe('getComputedDependencies', () => {
    it('should extract dependencies from dot notation', () => {
      const computeFn = (doc: Record<string, unknown>) =>
        (doc.price as number) * (doc.quantity as number);
      const deps = getComputedDependencies(computeFn);
      expect(deps).toContain('price');
      expect(deps).toContain('quantity');
    });

    it('should extract dependencies from bracket notation', () => {
      const computeFn = (doc: Record<string, unknown>) =>
        (doc['price'] as number) * (doc['quantity'] as number);
      const deps = getComputedDependencies(computeFn);
      expect(deps).toContain('price');
      expect(deps).toContain('quantity');
    });

    it('should not duplicate dependencies', () => {
      const computeFn = (doc: Record<string, unknown>) =>
        (doc.price as number) + (doc.price as number);
      const deps = getComputedDependencies(computeFn);
      expect(deps.filter((d) => d === 'price').length).toBe(1);
    });

    it('should handle functions with no dependencies', () => {
      const computeFn = () => 42;
      const deps = getComputedDependencies(computeFn);
      expect(deps.length).toBe(0);
    });
  });

  describe('buildComputedDependencyGraph', () => {
    it('should build dependency graph for computed fields', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          price: number({ label: 'Price' }),
          quantity: number({ label: 'Quantity' }),
          total: number({
            label: 'Total',
            computed: (doc) => (doc.price as number) * (doc.quantity as number),
          }),
        },
      });

      const graph = buildComputedDependencyGraph(schema);
      expect(graph.length).toBe(1);
      expect(graph[0].fieldName).toBe('total');
      expect(graph[0].dependsOn).toContain('price');
      expect(graph[0].dependsOn).toContain('quantity');
    });

    it('should handle computed fields depending on other computed fields', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          price: number({ label: 'Price' }),
          quantity: number({ label: 'Quantity' }),
          subtotal: number({
            label: 'Subtotal',
            computed: (doc) => (doc.price as number) * (doc.quantity as number),
          }),
          tax: number({
            label: 'Tax',
            computed: (doc) => (doc.subtotal as number) * 0.1,
          }),
          total: number({
            label: 'Total',
            computed: (doc) => (doc.subtotal as number) + (doc.tax as number),
          }),
        },
      });

      const graph = buildComputedDependencyGraph(schema);
      expect(graph.length).toBe(3);

      const taxDep = graph.find((g) => g.fieldName === 'tax');
      expect(taxDep?.dependsOn).toContain('subtotal');

      const totalDep = graph.find((g) => g.fieldName === 'total');
      expect(totalDep?.dependsOn).toContain('subtotal');
      expect(totalDep?.dependsOn).toContain('tax');
    });
  });

  describe('detectComputedCircularDependencies', () => {
    it('should detect no circular dependencies in valid schema', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          price: number({ label: 'Price' }),
          total: number({
            label: 'Total',
            computed: (doc) => (doc.price as number) * 2,
          }),
        },
      });

      const check = detectComputedCircularDependencies(schema);
      expect(check.hasCircular).toBe(false);
    });

    it('should detect simple circular dependency A -> B -> A', () => {
      // Create mock schema bypassing validation
      const mockSchema = {
        name: 'circular',
        label: 'Circular',
        labelPlural: 'Circulars',
        fields: {
          fieldA: {
            type: 'number' as const,
            options: {
              label: 'Field A',
              computed: (doc: Record<string, unknown>) => (doc.fieldB as number) * 2,
            },
          },
          fieldB: {
            type: 'number' as const,
            options: {
              label: 'Field B',
              computed: (doc: Record<string, unknown>) => (doc.fieldA as number) + 1,
            },
          },
        },
      };

      const check = detectComputedCircularDependencies(mockSchema);
      expect(check.hasCircular).toBe(true);
      expect(check.cycle).toBeDefined();
    });

    it('should detect chain circular dependency A -> B -> C -> A', () => {
      const mockSchema = {
        name: 'chain',
        label: 'Chain',
        labelPlural: 'Chains',
        fields: {
          a: {
            type: 'number' as const,
            options: {
              label: 'A',
              computed: (doc: Record<string, unknown>) => (doc.c as number) + 1,
            },
          },
          b: {
            type: 'number' as const,
            options: {
              label: 'B',
              computed: (doc: Record<string, unknown>) => (doc.a as number) * 2,
            },
          },
          c: {
            type: 'number' as const,
            options: {
              label: 'C',
              computed: (doc: Record<string, unknown>) => (doc.b as number) - 1,
            },
          },
        },
      };

      const check = detectComputedCircularDependencies(mockSchema);
      expect(check.hasCircular).toBe(true);
    });
  });

  describe('getComputationOrder', () => {
    it('should return fields in topological order', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          price: number({ label: 'Price' }),
          quantity: number({ label: 'Quantity' }),
          subtotal: number({
            label: 'Subtotal',
            computed: (doc) => (doc.price as number) * (doc.quantity as number),
          }),
          tax: number({
            label: 'Tax',
            computed: (doc) => (doc.subtotal as number) * 0.1,
          }),
          total: number({
            label: 'Total',
            computed: (doc) => (doc.subtotal as number) + (doc.tax as number),
          }),
        },
      });

      const order = getComputationOrder(schema);

      // Subtotal should come before tax and total
      const subtotalIdx = order.indexOf('subtotal');
      const taxIdx = order.indexOf('tax');
      const totalIdx = order.indexOf('total');

      expect(subtotalIdx).toBeLessThan(taxIdx);
      expect(subtotalIdx).toBeLessThan(totalIdx);
      expect(taxIdx).toBeLessThan(totalIdx);
    });

    it('should handle independent computed fields in any order', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          a: number({ label: 'A' }),
          b: number({ label: 'B' }),
          compA: number({
            label: 'Computed A',
            computed: (doc) => (doc.a as number) * 2,
          }),
          compB: number({
            label: 'Computed B',
            computed: (doc) => (doc.b as number) * 3,
          }),
        },
      });

      const order = getComputationOrder(schema);
      expect(order).toContain('compA');
      expect(order).toContain('compB');
      expect(order.length).toBe(2);
    });
  });

  describe('calculateComputedField', () => {
    it('should calculate a computed field value', () => {
      const computeFn = (doc: Record<string, unknown>) =>
        (doc.price as number) * (doc.quantity as number);
      const doc = { price: 10, quantity: 5 };
      const result = calculateComputedField(computeFn, doc);
      expect(result).toBe(50);
    });

    it('should return undefined on error', () => {
      const computeFn = () => {
        throw new Error('Test error');
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = calculateComputedField(computeFn, {});
      expect(result).toBeUndefined();
      consoleSpy.mockRestore();
    });

    it('should handle null/undefined values gracefully', () => {
      const computeFn = (doc: Record<string, unknown>) => {
        const price = (doc.price as number) ?? 0;
        const qty = (doc.quantity as number) ?? 0;
        return price * qty;
      };
      const result = calculateComputedField(computeFn, {});
      expect(result).toBe(0);
    });
  });

  describe('calculateComputedFields', () => {
    it('should calculate all computed fields in correct order', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          price: number({ label: 'Price' }),
          quantity: number({ label: 'Quantity' }),
          subtotal: number({
            label: 'Subtotal',
            computed: (doc) => (doc.price as number) * (doc.quantity as number),
          }),
          tax: number({
            label: 'Tax',
            computed: (doc) => (doc.subtotal as number) * 0.1,
          }),
          total: number({
            label: 'Total',
            computed: (doc) => (doc.subtotal as number) + (doc.tax as number),
          }),
        },
      });

      const doc = { price: 100, quantity: 2 };
      const result = calculateComputedFields(schema, doc);

      expect(result.computedValues.get('subtotal')).toBe(200);
      expect(result.computedValues.get('tax')).toBe(20);
      expect(result.computedValues.get('total')).toBe(220);
      expect(result.document.total).toBe(220);
      expect(result.errors.size).toBe(0);
    });

    it('should include computed values in returned document', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          firstName: text({ label: 'First Name' }),
          lastName: text({ label: 'Last Name' }),
          fullName: text({
            label: 'Full Name',
            computed: (doc) => `${doc.firstName} ${doc.lastName}`,
          }),
        },
      });

      const doc = { firstName: 'John', lastName: 'Doe' };
      const result = calculateComputedFields(schema, doc);

      expect(result.document.fullName).toBe('John Doe');
    });

    it('should capture errors for individual fields', () => {
      const mockSchema = {
        name: 'test',
        label: 'Test',
        labelPlural: 'Tests',
        fields: {
          good: {
            type: 'number' as const,
            options: {
              label: 'Good',
              computed: () => 42,
            },
          },
          bad: {
            type: 'number' as const,
            options: {
              label: 'Bad',
              computed: () => {
                throw new Error('Computation failed');
              },
            },
          },
        },
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = calculateComputedFields(mockSchema, {});

      expect(result.computedValues.get('good')).toBe(42);
      expect(result.errors.has('bad')).toBe(true);
      expect(result.errors.get('bad')).toContain('Computation failed');
      consoleSpy.mockRestore();
    });
  });

  describe('getFieldsToRecalculate', () => {
    it('should return fields that depend on changed field', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          price: number({ label: 'Price' }),
          quantity: number({ label: 'Quantity' }),
          total: number({
            label: 'Total',
            computed: (doc) => (doc.price as number) * (doc.quantity as number),
          }),
          independent: number({
            label: 'Independent',
            computed: () => 100,
          }),
        },
      });

      const toRecalc = getFieldsToRecalculate(schema, 'price');
      expect(toRecalc).toContain('total');
      expect(toRecalc).not.toContain('independent');
    });

    it('should include transitive dependencies', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          price: number({ label: 'Price' }),
          quantity: number({ label: 'Quantity' }),
          subtotal: number({
            label: 'Subtotal',
            computed: (doc) => (doc.price as number) * (doc.quantity as number),
          }),
          tax: number({
            label: 'Tax',
            computed: (doc) => (doc.subtotal as number) * 0.1,
          }),
          total: number({
            label: 'Total',
            computed: (doc) => (doc.subtotal as number) + (doc.tax as number),
          }),
        },
      });

      // Changing price should trigger recalc of subtotal, tax, and total
      const toRecalc = getFieldsToRecalculate(schema, 'price');
      expect(toRecalc).toContain('subtotal');
      expect(toRecalc).toContain('tax');
      expect(toRecalc).toContain('total');
    });

    it('should return fields in computation order', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          price: number({ label: 'Price' }),
          subtotal: number({
            label: 'Subtotal',
            computed: (doc) => (doc.price as number) * 2,
          }),
          total: number({
            label: 'Total',
            computed: (doc) => (doc.subtotal as number) + 10,
          }),
        },
      });

      const toRecalc = getFieldsToRecalculate(schema, 'price');
      const subtotalIdx = toRecalc.indexOf('subtotal');
      const totalIdx = toRecalc.indexOf('total');

      expect(subtotalIdx).toBeLessThan(totalIdx);
    });

    it('should return empty array when no computed fields depend on changed field', () => {
      const schema = defineSchema({
        name: 'product',
        label: 'Product',
        fields: {
          price: number({ label: 'Price' }),
          name: text({ label: 'Name' }),
          computed: number({
            label: 'Computed',
            computed: (doc) => (doc.price as number) * 2,
          }),
        },
      });

      const toRecalc = getFieldsToRecalculate(schema, 'name');
      expect(toRecalc.length).toBe(0);
    });
  });
});

describe('Computed Fields Integration', () => {
  it('should work with boolean computed fields', () => {
    const schema = defineSchema({
      name: 'product',
      label: 'Product',
      fields: {
        price: number({ label: 'Price' }),
        isExpensive: boolean({
          label: 'Is Expensive',
          computed: (doc): boolean => (doc.price as number) > 100,
        }),
      },
    });

    const doc = { price: 150 };
    const result = calculateComputedFields(schema, doc);
    expect(result.computedValues.get('isExpensive')).toBe(true);

    const doc2 = { price: 50 };
    const result2 = calculateComputedFields(schema, doc2);
    expect(result2.computedValues.get('isExpensive')).toBe(false);
  });

  it('should work with text computed fields', () => {
    const schema = defineSchema({
      name: 'person',
      label: 'Person',
      fields: {
        firstName: text({ label: 'First Name' }),
        lastName: text({ label: 'Last Name' }),
        displayName: text({
          label: 'Display Name',
          computed: (doc) =>
            `${doc.lastName}, ${doc.firstName}`,
        }),
      },
    });

    const doc = { firstName: 'Jane', lastName: 'Smith' };
    const result = calculateComputedFields(schema, doc);
    expect(result.computedValues.get('displayName')).toBe('Smith, Jane');
  });

  it('should handle missing input values', () => {
    const schema = defineSchema({
      name: 'product',
      label: 'Product',
      fields: {
        price: number({ label: 'Price' }),
        quantity: number({ label: 'Quantity' }),
        total: number({
          label: 'Total',
          computed: (doc) => {
            const price = (doc.price as number) || 0;
            const qty = (doc.quantity as number) || 0;
            return price * qty;
          },
        }),
      },
    });

    // Missing quantity
    const doc = { price: 10 };
    const result = calculateComputedFields(schema, doc);
    expect(result.computedValues.get('total')).toBe(0);
  });
});
