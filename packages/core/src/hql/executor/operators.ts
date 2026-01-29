/**
 * HOOPERITS CMS - HQL Operators
 * Operator evaluation for HQL expressions
 */

import type { BinaryOperator } from '../ast/types';

// =============================================================================
// Comparison Operators
// =============================================================================

export function evaluateComparison(
  operator: BinaryOperator,
  left: unknown,
  right: unknown
): boolean {
  switch (operator) {
    case '==':
      return equals(left, right);
    case '!=':
      return !equals(left, right);
    case '>':
      return compare(left, right) > 0;
    case '<':
      return compare(left, right) < 0;
    case '>=':
      return compare(left, right) >= 0;
    case '<=':
      return compare(left, right) <= 0;
    case 'in':
      return evaluateIn(left, right);
    case 'match':
      return evaluateMatch(left, right);
    default:
      return false;
  }
}

// =============================================================================
// Logical Operators
// =============================================================================

export function evaluateLogical(
  operator: '&&' | '||',
  left: unknown,
  right: unknown
): boolean {
  switch (operator) {
    case '&&':
      return Boolean(left) && Boolean(right);
    case '||':
      return Boolean(left) || Boolean(right);
    default:
      return false;
  }
}

export function evaluateNot(value: unknown): boolean {
  return !value;
}

// =============================================================================
// Special Operators
// =============================================================================

/**
 * Evaluate the 'in' operator
 * Checks if left value is contained in right array
 */
export function evaluateIn(left: unknown, right: unknown): boolean {
  if (!Array.isArray(right)) {
    return false;
  }

  // Use deep equality check for objects
  return right.some((item) => equals(left, item));
}

/** Maximum wildcards allowed in a match pattern to prevent ReDoS */
const MAX_WILDCARDS = 3;

/** Maximum string length for match operations */
const MAX_MATCH_STRING_LENGTH = 1000;

/**
 * Evaluate the 'match' operator
 * Pattern matching with * wildcards
 *
 * Security: Protected against ReDoS by:
 * - Limiting number of wildcards
 * - Limiting input string length
 * - Using non-backtracking pattern
 */
export function evaluateMatch(left: unknown, right: unknown): boolean {
  if (typeof left !== 'string' || typeof right !== 'string') {
    return false;
  }

  // Security: Limit input string length to prevent long matching times
  if (left.length > MAX_MATCH_STRING_LENGTH) {
    return false;
  }

  // Security: Count and limit wildcards to prevent ReDoS
  const wildcardCount = (right.match(/\*/g) || []).length;
  if (wildcardCount > MAX_WILDCARDS) {
    // Too many wildcards - return false instead of throwing to prevent info leak
    return false;
  }

  // Convert pattern to regex
  // Escape special regex characters, then convert * to non-greedy match
  const pattern = right
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*?'); // Non-greedy to reduce backtracking

  try {
    const regex = new RegExp(`^${pattern}$`, 'i');
    return regex.test(left);
  } catch {
    // Invalid regex pattern
    return false;
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Deep equality check
 */
function equals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!equals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false;
      }
    }

    return true;
  }

  return false;
}

/**
 * Compare two values for ordering
 * Returns negative if a < b, positive if a > b, 0 if equal
 */
function compare(a: unknown, b: unknown): number {
  // Handle null/undefined
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : -1;
  if (b === null || b === undefined) return 1;

  // Numbers
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  // Strings
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }

  // Dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  // Booleans (true > false)
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return (a ? 1 : 0) - (b ? 1 : 0);
  }

  // Fallback: convert to string
  return String(a).localeCompare(String(b));
}

// =============================================================================
// Prisma Operator Mapping
// =============================================================================

export function getPrismaOperator(hqlOperator: string): string {
  const mapping: Record<string, string> = {
    '==': 'equals',
    '!=': 'not',
    '>': 'gt',
    '<': 'lt',
    '>=': 'gte',
    '<=': 'lte',
    'in': 'in',
  };

  return mapping[hqlOperator] || 'equals';
}
