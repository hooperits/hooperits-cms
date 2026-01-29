/**
 * HOOPERITS CMS - HQL Built-in Functions
 * Implementation of GROQ-compatible query functions
 */

import type { ExecutionContext } from './types';

export type HQLFunction = (
  args: unknown[],
  context: ExecutionContext
) => Promise<unknown> | unknown;

/**
 * Registry of built-in HQL functions
 */
export const builtinFunctions: Record<string, HQLFunction> = {
  // ==========================================================================
  // Aggregate Functions
  // ==========================================================================

  /**
   * count(array) - Returns the number of elements in an array
   * count(*[_type == "post"]) -> number of posts
   */
  count: (args: unknown[]): number => {
    const value = args[0];
    if (Array.isArray(value)) {
      return value.length;
    }
    if (value === null || value === undefined) {
      return 0;
    }
    return 1;
  },

  /**
   * length(value) - Returns the length of a string or array
   * length(title) -> string length
   * length(tags) -> array length
   */
  length: (args: unknown[]): number => {
    const value = args[0];
    if (typeof value === 'string') {
      return value.length;
    }
    if (Array.isArray(value)) {
      return value.length;
    }
    return 0;
  },

  // ==========================================================================
  // String Functions
  // ==========================================================================

  /**
   * lower(string) - Converts string to lowercase
   */
  lower: (args: unknown[]): string => {
    const value = args[0];
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return '';
  },

  /**
   * upper(string) - Converts string to uppercase
   */
  upper: (args: unknown[]): string => {
    const value = args[0];
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    return '';
  },

  /**
   * trim(string) - Removes leading and trailing whitespace
   */
  trim: (args: unknown[]): string => {
    const value = args[0];
    if (typeof value === 'string') {
      return value.trim();
    }
    return '';
  },

  /**
   * string(value) - Converts value to string
   */
  string: (args: unknown[]): string => {
    const value = args[0];
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  },

  // ==========================================================================
  // Type Check Functions
  // ==========================================================================

  /**
   * defined(value) - Returns true if value is not null/undefined
   */
  defined: (args: unknown[]): boolean => {
    const value = args[0];
    return value !== null && value !== undefined;
  },

  /**
   * coalesce(...values) - Returns first non-null value
   * coalesce(customTitle, title, "Untitled") -> first defined value
   */
  coalesce: (args: unknown[]): unknown => {
    for (const arg of args) {
      if (arg !== null && arg !== undefined) {
        return arg;
      }
    }
    return null;
  },

  /**
   * select(conditions...) - Conditional expression
   * select(status == "draft" => "Draft", status == "published" => "Live", "Unknown")
   * Note: Simplified implementation - full GROQ select is more complex
   */
  select: (args: unknown[]): unknown => {
    // For simple use: select(condition, trueValue, falseValue)
    if (args.length === 3) {
      return args[0] ? args[1] : args[2];
    }
    // Return last arg as default
    return args[args.length - 1] ?? null;
  },

  // ==========================================================================
  // Array Functions
  // ==========================================================================

  /**
   * array::unique(array) - Returns array with unique values
   */
  'array::unique': (args: unknown[]): unknown[] => {
    const value = args[0];
    if (!Array.isArray(value)) {
      return [];
    }
    return [...new Set(value)];
  },

  /**
   * array::compact(array) - Removes null/undefined values
   */
  'array::compact': (args: unknown[]): unknown[] => {
    const value = args[0];
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item) => item !== null && item !== undefined);
  },

  /**
   * array::join(array, separator) - Joins array elements into string
   */
  'array::join': (args: unknown[]): string => {
    const value = args[0];
    const separator = typeof args[1] === 'string' ? args[1] : ',';
    if (!Array.isArray(value)) {
      return '';
    }
    return value.map((item) => String(item ?? '')).join(separator);
  },

  // ==========================================================================
  // Math Functions
  // ==========================================================================

  /**
   * math::sum(array) - Sum of numeric array
   */
  'math::sum': (args: unknown[]): number => {
    const value = args[0];
    if (!Array.isArray(value)) {
      return 0;
    }
    return value.reduce((acc: number, item) => {
      const num = typeof item === 'number' ? item : 0;
      return acc + num;
    }, 0);
  },

  /**
   * math::avg(array) - Average of numeric array
   */
  'math::avg': (args: unknown[]): number | null => {
    const value = args[0];
    if (!Array.isArray(value) || value.length === 0) {
      return null;
    }
    const sum = value.reduce((acc: number, item) => {
      const num = typeof item === 'number' ? item : 0;
      return acc + num;
    }, 0);
    return sum / value.length;
  },

  /**
   * math::min(array) - Minimum value in array
   */
  'math::min': (args: unknown[]): number | null => {
    const value = args[0];
    if (!Array.isArray(value) || value.length === 0) {
      return null;
    }
    const numbers = value.filter((item): item is number => typeof item === 'number');
    if (numbers.length === 0) return null;
    return Math.min(...numbers);
  },

  /**
   * math::max(array) - Maximum value in array
   */
  'math::max': (args: unknown[]): number | null => {
    const value = args[0];
    if (!Array.isArray(value) || value.length === 0) {
      return null;
    }
    const numbers = value.filter((item): item is number => typeof item === 'number');
    if (numbers.length === 0) return null;
    return Math.max(...numbers);
  },

  /**
   * round(number, precision?) - Round number to precision
   */
  round: (args: unknown[]): number => {
    const value = args[0];
    const precision = typeof args[1] === 'number' ? args[1] : 0;
    if (typeof value !== 'number') {
      return 0;
    }
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  },

  // ==========================================================================
  // Date/Time Functions
  // ==========================================================================

  /**
   * now() - Returns current ISO timestamp
   */
  now: (): string => {
    return new Date().toISOString();
  },

  /**
   * dateTime(value) - Parses string to date
   */
  dateTime: (args: unknown[]): string | null => {
    const value = args[0];
    if (!value) return null;
    try {
      const date = new Date(String(value));
      return date.toISOString();
    } catch {
      return null;
    }
  },
};

/**
 * Get a function by name, supporting both simple names and namespaced names
 */
export function getFunction(name: string, namespace?: string): HQLFunction | undefined {
  if (namespace) {
    return builtinFunctions[`${namespace}::${name}`];
  }
  return builtinFunctions[name];
}

/**
 * Check if a function exists
 */
export function hasFunction(name: string, namespace?: string): boolean {
  return getFunction(name, namespace) !== undefined;
}
