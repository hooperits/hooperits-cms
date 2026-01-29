/**
 * HOOPERITS CMS - HQL Token Definitions
 * Lexer tokens for the HQL query language
 */

import { createToken, Lexer } from 'chevrotain';

// =============================================================================
// Whitespace & Comments (Skipped)
// =============================================================================

export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

export const LineComment = createToken({
  name: 'LineComment',
  pattern: /\/\/[^\n\r]*/,
  group: Lexer.SKIPPED,
});

// =============================================================================
// Keywords
// =============================================================================

export const True = createToken({ name: 'True', pattern: /true/ });
export const False = createToken({ name: 'False', pattern: /false/ });
export const Null = createToken({ name: 'Null', pattern: /null/ });
export const Asc = createToken({ name: 'Asc', pattern: /asc/ });
export const Desc = createToken({ name: 'Desc', pattern: /desc/ });
export const Order = createToken({ name: 'Order', pattern: /order/ });
export const In = createToken({ name: 'In', pattern: /in/ });
export const Match = createToken({ name: 'Match', pattern: /match/ });

// =============================================================================
// Identifiers (must come after keywords)
// =============================================================================

export const Identifier = createToken({
  name: 'Identifier',
  pattern: /[a-zA-Z_][a-zA-Z0-9_]*/,
});

// =============================================================================
// Literals
// =============================================================================

export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
});

export const NumberLiteral = createToken({
  name: 'NumberLiteral',
  pattern: /-?\d+(\.\d+)?/,
});

// =============================================================================
// Operators
// =============================================================================

// Comparison
export const Equals = createToken({ name: 'Equals', pattern: /==/ });
export const NotEquals = createToken({ name: 'NotEquals', pattern: /!=/ });
export const GreaterThanOrEqual = createToken({ name: 'GreaterThanOrEqual', pattern: />=/ });
export const LessThanOrEqual = createToken({ name: 'LessThanOrEqual', pattern: /<=/ });
export const GreaterThan = createToken({ name: 'GreaterThan', pattern: />/ });
export const LessThan = createToken({ name: 'LessThan', pattern: /</ });

// Logical
export const And = createToken({ name: 'And', pattern: /&&/ });
export const Or = createToken({ name: 'Or', pattern: /\|\|/ });
export const Not = createToken({ name: 'Not', pattern: /!/ });

// Reference
export const Dereference = createToken({ name: 'Dereference', pattern: /->/ });

// Range (order matters: ... before ..)
export const ExclusiveRange = createToken({ name: 'ExclusiveRange', pattern: /\.\.\./ });
export const InclusiveRange = createToken({ name: 'InclusiveRange', pattern: /\.\./ });

// =============================================================================
// Punctuation
// =============================================================================

export const Star = createToken({ name: 'Star', pattern: /\*/ });
export const Pipe = createToken({ name: 'Pipe', pattern: /\|/ });
export const Dot = createToken({ name: 'Dot', pattern: /\./ });
export const Comma = createToken({ name: 'Comma', pattern: /,/ });
export const Colon = createToken({ name: 'Colon', pattern: /:/ });
export const Dollar = createToken({ name: 'Dollar', pattern: /\$/ });
export const Caret = createToken({ name: 'Caret', pattern: /\^/ });
export const At = createToken({ name: 'At', pattern: /@/ });

// Brackets
export const LSquare = createToken({ name: 'LSquare', pattern: /\[/ });
export const RSquare = createToken({ name: 'RSquare', pattern: /]/ });
export const LCurly = createToken({ name: 'LCurly', pattern: /\{/ });
export const RCurly = createToken({ name: 'RCurly', pattern: /}/ });
export const LParen = createToken({ name: 'LParen', pattern: /\(/ });
export const RParen = createToken({ name: 'RParen', pattern: /\)/ });

// =============================================================================
// Token List (Order Matters!)
// =============================================================================

export const allTokens = [
  // Whitespace & comments first
  WhiteSpace,
  LineComment,

  // Multi-character operators before single-character (longest match)
  ExclusiveRange,  // ... before ..
  InclusiveRange,  // ..
  Dereference,     // ->
  Equals,          // ==
  NotEquals,       // !=
  GreaterThanOrEqual,
  LessThanOrEqual,
  And,             // &&
  Or,              // ||

  // Single-character operators
  GreaterThan,
  LessThan,
  Not,
  Star,
  Pipe,
  Dot,
  Comma,
  Colon,
  Dollar,
  Caret,
  At,

  // Brackets
  LSquare,
  RSquare,
  LCurly,
  RCurly,
  LParen,
  RParen,

  // Keywords (before Identifier)
  True,
  False,
  Null,
  Asc,
  Desc,
  Order,
  In,
  Match,

  // Identifier last among keywords/identifiers
  Identifier,

  // Literals
  StringLiteral,
  NumberLiteral,
];
