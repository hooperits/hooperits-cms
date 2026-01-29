/**
 * HOOPERITS CMS - HQL API Handler
 * REST endpoint for executing HQL queries
 */

import type { NextRequest } from 'next/server';
import { query as executeQuery, parse, HQLError, isHQLError } from '../hql';
import { getCache } from '../cache';
import { estimateQueryCost } from '../hql/optimizer/cost';
import type { HQLQueryOptions, HQLQueryResult, HQLQueryMeta } from '../hql/types';

// =============================================================================
// Security Constants
// =============================================================================

/** Maximum query string length (10KB) */
const MAX_QUERY_LENGTH = parseInt(process.env.HQL_MAX_QUERY_LENGTH || '10240', 10);

/** Maximum request body size (64KB) */
const MAX_BODY_SIZE = parseInt(process.env.HQL_MAX_BODY_SIZE || '65536', 10);

/** Maximum parameters object size (4KB) */
const MAX_PARAMS_SIZE = parseInt(process.env.HQL_MAX_PARAMS_SIZE || '4096', 10);

// =============================================================================
// Request/Response Types
// =============================================================================

export interface HQLRequest {
  query: string;
  params?: Record<string, unknown>;
  options?: HQLQueryOptions;
}

export interface HQLResponse<T = unknown> {
  data: T;
  meta: HQLQueryMeta;
}

export interface HQLErrorResponse {
  error: {
    code: string;
    message: string;
    position?: {
      line: number;
      column: number;
      offset: number;
    };
    details?: Record<string, unknown>;
  };
}

// =============================================================================
// Default Options
// =============================================================================

/** Server-enforced maximum query cost (cannot be overridden by client) */
const SERVER_MAX_COST = parseInt(process.env.HQL_MAX_COST || '1000', 10);

/** Server-enforced maximum reference depth (cannot be overridden by client) */
const SERVER_MAX_DEPTH = parseInt(process.env.HQL_MAX_DEPTH || '5', 10);

/** Default cache TTL in seconds */
const DEFAULT_CACHE_TTL = parseInt(process.env.HQL_CACHE_TTL || '60', 10);

/** Maximum cache TTL to prevent cache poisoning */
const MAX_CACHE_TTL = parseInt(process.env.HQL_MAX_CACHE_TTL || '3600', 10);

// =============================================================================
// API Handler
// =============================================================================

/**
 * Configuration for HQL query handler
 */
export interface HQLHandlerConfig {
  /** Function to validate authentication. Should return true if authenticated. */
  isAuthenticated?: (req: NextRequest) => Promise<boolean> | boolean;
  /** Whether authentication is required (default: true) */
  requireAuth?: boolean;
}

export async function handleHQLQuery(
  req: NextRequest,
  config: HQLHandlerConfig = {}
): Promise<Response> {
  const startTime = performance.now();

  try {
    // Security: Check authentication if required
    const requireAuth = config.requireAuth ?? true;
    if (requireAuth && config.isAuthenticated) {
      const isAuth = await config.isAuthenticated(req);
      if (!isAuth) {
        return createErrorResponse(
          'UNAUTHORIZED',
          'Authentication required',
          401
        );
      }
    }

    // Security: Check Content-Length header
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return createErrorResponse(
        'PAYLOAD_TOO_LARGE',
        `Request body exceeds maximum size of ${MAX_BODY_SIZE} bytes`,
        413
      );
    }

    // Parse request body
    const body = await req.json() as HQLRequest;

    if (!body.query || typeof body.query !== 'string') {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Missing required field: query',
        400
      );
    }

    // Security: Validate query string length
    if (body.query.length > MAX_QUERY_LENGTH) {
      return createErrorResponse(
        'QUERY_TOO_LARGE',
        `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters`,
        413
      );
    }

    // Security: Validate parameters size
    if (body.params) {
      const paramsSize = JSON.stringify(body.params).length;
      if (paramsSize > MAX_PARAMS_SIZE) {
        return createErrorResponse(
          'PARAMS_TOO_LARGE',
          `Parameters exceed maximum size of ${MAX_PARAMS_SIZE} bytes`,
          413
        );
      }
    }

    // Security: Merge options with server-enforced limits (cannot be overridden by client)
    const options: HQLQueryOptions = {
      maxDepth: Math.min(body.options?.maxDepth ?? SERVER_MAX_DEPTH, SERVER_MAX_DEPTH),
      maxCost: Math.min(body.options?.maxCost ?? SERVER_MAX_COST, SERVER_MAX_COST),
      cacheTTL: Math.min(body.options?.cacheTTL ?? DEFAULT_CACHE_TTL, MAX_CACHE_TTL),
      noCache: body.options?.noCache ?? false,
    };

    // Parse query to check cost before execution
    const parseStart = performance.now();
    let ast;
    try {
      ast = parse(body.query);
    } catch (error) {
      if (isHQLError(error)) {
        return createErrorResponse(
          error.code,
          error.message,
          400,
          error.position,
          error.details
        );
      }
      throw error;
    }
    const parseTime = performance.now() - parseStart;

    // Check query cost
    const cost = estimateQueryCost(ast);
    if (cost > options.maxCost!) {
      return createErrorResponse(
        'COST_EXCEEDED',
        `Query cost (${cost}) exceeds maximum allowed (${options.maxCost})`,
        429,
        undefined,
        { cost, maxCost: options.maxCost }
      );
    }

    // Check cache
    const cache = getCache();
    const cacheKey = `hql:${body.query}:${JSON.stringify(body.params || {})}`;

    if (!options.noCache) {
      const cached = cache.get<HQLQueryResult>(cacheKey);
      if (cached) {
        const totalTime = performance.now() - startTime;
        return createSuccessResponse({
          ...cached,
          meta: {
            ...cached.meta,
            cached: true,
            totalTime: Math.round(totalTime * 100) / 100,
          },
        });
      }
    }

    // Execute query
    const executeStart = performance.now();
    const result = await executeQuery(body.query, body.params);
    const executeTime = performance.now() - executeStart;
    const totalTime = performance.now() - startTime;

    // Build response with timing
    const response: HQLResponse = {
      data: result.data,
      meta: {
        parseTime: Math.round(parseTime * 100) / 100,
        executeTime: Math.round(executeTime * 100) / 100,
        totalTime: Math.round(totalTime * 100) / 100,
        cost,
        cached: false,
        scannedCount: result.meta.scannedCount,
        returnedCount: result.meta.returnedCount,
      },
    };

    // Cache result
    if (!options.noCache) {
      cache.set(cacheKey, response, ['hql']);
    }

    return createSuccessResponse(response);
  } catch (error) {
    if (isHQLError(error)) {
      return createErrorResponse(
        error.code,
        error.message,
        getStatusCodeForError(error.code),
        error.position,
        error.details
      );
    }

    // Security: Log full error server-side but return sanitized message to client
    console.error('HQL execution error:', error);
    return createErrorResponse(
      'EXECUTION_ERROR',
      'An unexpected error occurred while processing the query',
      500
    );
  }
}

// =============================================================================
// Response Helpers
// =============================================================================

function createSuccessResponse(data: HQLResponse): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function createErrorResponse(
  code: string,
  message: string,
  status: number,
  position?: { line: number; column: number; offset: number },
  details?: Record<string, unknown>
): Response {
  const errorResponse: HQLErrorResponse = {
    error: {
      code,
      message,
      ...(position && { position }),
      ...(details && { details }),
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function getStatusCodeForError(code: string): number {
  switch (code) {
    case 'PARSE_ERROR':
    case 'VALIDATION_ERROR':
    case 'UNKNOWN_TYPE':
    case 'UNKNOWN_FIELD':
    case 'INVALID_PARAM':
      return 400;
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'PAYLOAD_TOO_LARGE':
    case 'QUERY_TOO_LARGE':
    case 'PARAMS_TOO_LARGE':
      return 413;
    case 'COST_EXCEEDED':
    case 'DEPTH_EXCEEDED':
      return 429;
    case 'TIMEOUT':
      return 504;
    default:
      return 500;
  }
}
