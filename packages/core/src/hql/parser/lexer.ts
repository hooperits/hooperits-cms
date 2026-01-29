/**
 * HOOPERITS CMS - HQL Lexer
 * Tokenizer for the HQL query language
 */

import { Lexer } from 'chevrotain';
import { allTokens } from './tokens';

export const HQLLexer = new Lexer(allTokens, {
  ensureOptimizations: true,
});

export function tokenize(input: string) {
  const result = HQLLexer.tokenize(input);
  return {
    tokens: result.tokens,
    errors: result.errors,
  };
}
