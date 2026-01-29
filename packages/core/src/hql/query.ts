/**
 * HOOPERITS CMS - HQL Query Entry Point
 * Main function for executing HQL queries
 */

import { tokenize } from './parser/lexer';
import { hqlParser } from './parser/parser';
import { hqlAstVisitor } from './parser/visitor';
import { HQLExecutor } from './executor/executor';
import {
  HQLError,
  createParseError,
  createCostExceededError,
  createTimeoutError,
  createExecutionError,
} from './errors';
import { estimateQueryCost } from './optimizer/cost';
import type { QueryNode } from './ast/types';
import type {
  HQLQueryInput,
  HQLQueryResult,
  HQLQueryOptions,
  HQLQueryMeta,
} from './types';
import { getCache } from '../cache';

// =============================================================================
// Main Query Function
// =============================================================================

export async function query<T = unknown>(
  input: string | HQLQueryInput,
  params?: Record<string, unknown>
): Promise<HQLQueryResult<T>> {
  const startTime = performance.now();

  // Normalize input
  const queryInput: HQLQueryInput =
    typeof input === 'string' ? { query: input, params } : input;

  const queryParams = queryInput.params || params || {};
  const options = queryInput.options || {};

  // Check cache
  const cache = getCache();
  const cacheKey = `hql:${queryInput.query}:${JSON.stringify(queryParams)}`;

  if (!options.noCache) {
    const cached = cache.get<HQLQueryResult<T>>(cacheKey);
    if (cached) {
      return {
        ...cached,
        meta: {
          ...cached.meta,
          cached: true,
        },
      };
    }
  }

  // Parse
  const parseStart = performance.now();
  const ast = parse(queryInput.query);
  const parseTime = performance.now() - parseStart;

  // Cost validation
  const maxCost = options.maxCost ?? 1000;
  const estimatedCost = estimateQueryCost(ast);
  if (estimatedCost > maxCost) {
    throw createCostExceededError(estimatedCost, maxCost);
  }

  // Execute with timeout
  const executeStart = performance.now();
  const executor = new HQLExecutor(options);
  const timeout = options.timeout ?? 30000;

  const executeWithTimeout = async () => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(createTimeoutError(timeout)), timeout);
    });

    try {
      const result = await Promise.race([
        executor.execute(ast, queryParams),
        timeoutPromise,
      ]);
      // Clear timeout on success to prevent memory leak
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      // Clear timeout on error to prevent memory leak
      clearTimeout(timeoutId!);
      if (error instanceof HQLError) {
        throw error;
      }
      throw createExecutionError(
        error instanceof Error ? error.message : 'Unknown execution error',
        error
      );
    }
  };

  const result = await executeWithTimeout();
  const executeTime = performance.now() - executeStart;

  const totalTime = performance.now() - startTime;

  const queryResult: HQLQueryResult<T> = {
    data: result.data as T,
    meta: {
      parseTime: Math.round(parseTime * 100) / 100,
      executeTime: Math.round(executeTime * 100) / 100,
      totalTime: Math.round(totalTime * 100) / 100,
      cost: result.meta.cost,
      cached: false,
      scannedCount: result.meta.scannedCount,
      returnedCount: result.meta.returnedCount,
    },
  };

  // Store in cache
  if (!options.noCache) {
    cache.set(cacheKey, queryResult, ['hql']);
  }

  return queryResult;
}

// =============================================================================
// Parse Function
// =============================================================================

export function parse(queryString: string): QueryNode {
  // Tokenize
  const { tokens, errors: lexErrors } = tokenize(queryString);

  if (lexErrors.length > 0) {
    const error = lexErrors[0];
    throw createParseError(
      `Unexpected character: ${error.message}`,
      error.line || 1,
      error.column || 1,
      error.offset
    );
  }

  // Parse
  hqlParser.input = tokens;
  const cst = hqlParser.query();

  if (hqlParser.errors.length > 0) {
    const error = hqlParser.errors[0];
    const token = error.token;

    throw createParseError(
      error.message,
      token.startLine || 1,
      token.startColumn || 1,
      token.startOffset
    );
  }

  // Convert CST to AST
  const ast = hqlAstVisitor.visit(cst) as QueryNode;

  return ast;
}
