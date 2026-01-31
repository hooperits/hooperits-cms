/**
 * HOOPERITS CMS - Portable Text Utils Tests
 *
 * Unit tests for utility functions.
 */

import { describe, it, expect } from 'vitest';
import {
  generateBlockKey,
  generateSpanKey,
  generateMarkKey,
  generateInlineKey,
  generateKey,
  isValidKey,
  ensureUniqueKeys,
} from '../utils';

describe('Key Generation', () => {
  describe('generateBlockKey', () => {
    it('should generate a string with block prefix', () => {
      const key = generateBlockKey();
      expect(key).toMatch(/^block-[a-z0-9]+-[a-z0-9]+$/);
    });

    it('should generate unique keys on consecutive calls', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 100; i++) {
        keys.add(generateBlockKey());
      }
      expect(keys.size).toBe(100);
    });
  });

  describe('generateSpanKey', () => {
    it('should generate a string with span prefix', () => {
      const key = generateSpanKey();
      expect(key).toMatch(/^span-[a-z0-9]+-[a-z0-9]+$/);
    });

    it('should generate unique keys on consecutive calls', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 100; i++) {
        keys.add(generateSpanKey());
      }
      expect(keys.size).toBe(100);
    });
  });

  describe('generateMarkKey', () => {
    it('should generate a string with mark prefix', () => {
      const key = generateMarkKey();
      expect(key).toMatch(/^mark-[a-z0-9]+-[a-z0-9]+$/);
    });

    it('should generate unique keys on consecutive calls', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 100; i++) {
        keys.add(generateMarkKey());
      }
      expect(keys.size).toBe(100);
    });
  });

  describe('generateInlineKey', () => {
    it('should generate a string with inline prefix', () => {
      const key = generateInlineKey();
      expect(key).toMatch(/^inline-[a-z0-9]+-[a-z0-9]+$/);
    });

    it('should generate unique keys on consecutive calls', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 100; i++) {
        keys.add(generateInlineKey());
      }
      expect(keys.size).toBe(100);
    });
  });

  describe('generateKey', () => {
    it('should use default prefix "key"', () => {
      const key = generateKey();
      expect(key).toMatch(/^key-[a-z0-9]+-[a-z0-9]+$/);
    });

    it('should use custom prefix when provided', () => {
      const key = generateKey('custom');
      expect(key).toMatch(/^custom-[a-z0-9]+-[a-z0-9]+$/);
    });

    it('should generate unique keys with same prefix', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 100; i++) {
        keys.add(generateKey('test'));
      }
      expect(keys.size).toBe(100);
    });
  });
});

describe('Key Validation', () => {
  describe('isValidKey', () => {
    it('should return true for non-empty strings', () => {
      expect(isValidKey('abc')).toBe(true);
      expect(isValidKey('block-123')).toBe(true);
      expect(isValidKey('a')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isValidKey('')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isValidKey(null)).toBe(false);
      expect(isValidKey(undefined)).toBe(false);
      expect(isValidKey(123)).toBe(false);
      expect(isValidKey({})).toBe(false);
      expect(isValidKey([])).toBe(false);
    });
  });
});

describe('Key Uniqueness', () => {
  describe('ensureUniqueKeys', () => {
    it('should return items unchanged when all keys are unique', () => {
      const items = [
        { _key: 'a', value: 1 },
        { _key: 'b', value: 2 },
        { _key: 'c', value: 3 },
      ];
      const result = ensureUniqueKeys(items);
      expect(result).toEqual(items);
    });

    it('should regenerate duplicate keys', () => {
      const items = [
        { _key: 'a', value: 1 },
        { _key: 'a', value: 2 },
        { _key: 'b', value: 3 },
      ];
      const result = ensureUniqueKeys(items);

      // First item should keep its key
      expect(result[0]._key).toBe('a');
      // Second item should get a new key (not 'a')
      expect(result[1]._key).not.toBe('a');
      // Third item should keep its key
      expect(result[2]._key).toBe('b');
      // Values should be preserved
      expect(result.map((r) => r.value)).toEqual([1, 2, 3]);
    });

    it('should regenerate invalid keys (empty strings)', () => {
      const items = [
        { _key: '', value: 1 },
        { _key: 'b', value: 2 },
      ];
      const result = ensureUniqueKeys(items);

      expect(result[0]._key).not.toBe('');
      expect(result[0]._key.length).toBeGreaterThan(0);
      expect(result[1]._key).toBe('b');
    });

    it('should handle all duplicate keys', () => {
      const items = [
        { _key: 'dup', value: 1 },
        { _key: 'dup', value: 2 },
        { _key: 'dup', value: 3 },
      ];
      const result = ensureUniqueKeys(items);

      // First should keep original
      expect(result[0]._key).toBe('dup');
      // Others should be regenerated
      expect(result[1]._key).not.toBe('dup');
      expect(result[2]._key).not.toBe('dup');
      // All should now be unique
      const keys = new Set(result.map((r) => r._key));
      expect(keys.size).toBe(3);
    });

    it('should preserve other properties', () => {
      const items = [
        { _key: 'a', value: 1, extra: 'data' },
        { _key: 'a', value: 2, nested: { foo: 'bar' } },
      ];
      const result = ensureUniqueKeys(items);

      expect(result[0].extra).toBe('data');
      expect(result[1].nested).toEqual({ foo: 'bar' });
    });

    it('should handle empty array', () => {
      const result = ensureUniqueKeys([]);
      expect(result).toEqual([]);
    });

    it('should handle single item', () => {
      const items = [{ _key: 'only', value: 1 }];
      const result = ensureUniqueKeys(items);
      expect(result).toEqual(items);
    });
  });
});
