/**
 * HOOPERITS CMS - Portable Text Utilities
 *
 * Helper functions for working with Portable Text content.
 */

/**
 * Generate a unique key for a block
 * Uses a combination of timestamp and random string for uniqueness
 */
export function generateBlockKey(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `block-${timestamp}-${random}`;
}

/**
 * Generate a unique key for a span
 */
export function generateSpanKey(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `span-${timestamp}-${random}`;
}

/**
 * Generate a unique key for a mark definition
 */
export function generateMarkKey(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `mark-${timestamp}-${random}`;
}

/**
 * Generate a unique key for an inline object
 */
export function generateInlineKey(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `inline-${timestamp}-${random}`;
}

/**
 * Generate a generic unique key with optional prefix
 */
export function generateKey(prefix = 'key'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Check if a key is valid (non-empty string)
 */
export function isValidKey(key: unknown): key is string {
  return typeof key === 'string' && key.length > 0;
}

/**
 * Ensure all blocks have unique keys, regenerating duplicates
 */
export function ensureUniqueKeys<T extends { _key: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.map((item) => {
    if (!isValidKey(item._key) || seen.has(item._key)) {
      return { ...item, _key: generateKey() };
    }
    seen.add(item._key);
    return item;
  });
}
