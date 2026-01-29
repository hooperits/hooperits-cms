/**
 * HOOPERITS CMS - HQL Executor Types
 * Execution context and related interfaces
 */

import type { SchemaDefinition } from '../../schema/types';

// =============================================================================
// Execution Context
// =============================================================================

export interface ExecutionContext {
  /** Current document being processed */
  current: unknown;

  /** Parent document (for nested queries with ^) */
  parent?: unknown;

  /** Query parameters ($param) */
  params: Record<string, unknown>;

  /** Reference loader for batched loading */
  referenceLoader?: ReferenceLoader;

  /** Schema registry for validation */
  schemas?: Map<string, SchemaDefinition>;

  /** Execution options */
  options: ExecutionOptions;

  /** Current reference depth */
  depth: number;

  /** Content type being queried */
  contentType?: string;
}

// =============================================================================
// Reference Loader Interface
// =============================================================================

export interface ReferenceLoader {
  load(id: string): Promise<unknown>;
  loadMany(ids: string[]): Promise<unknown[]>;
  clear(): void;
}

// =============================================================================
// Execution Options
// =============================================================================

export interface ExecutionOptions {
  /** Maximum reference depth (default: 5) */
  maxDepth: number;

  /** Maximum query cost before rejection (default: 1000) */
  maxCost: number;

  /** Cache TTL in seconds (default: 60) */
  cacheTTL: number;

  /** Skip cache lookup */
  noCache: boolean;

  /** Query timeout in milliseconds */
  timeout: number;
}

export const DEFAULT_EXECUTION_OPTIONS: ExecutionOptions = {
  maxDepth: 5,
  maxCost: 1000,
  cacheTTL: 60,
  noCache: false,
  timeout: 30000,
};

// =============================================================================
// Query Execution Result
// =============================================================================

export interface ExecutionResult<T = unknown> {
  data: T;
  meta: ExecutionMeta;
}

export interface ExecutionMeta {
  scannedCount: number;
  returnedCount: number;
  cost: number;
  depth: number;
}

// =============================================================================
// Prisma Query Building
// =============================================================================

export interface PrismaWhereClause {
  [key: string]: unknown;
}

export interface PrismaOrderByClause {
  [key: string]: 'asc' | 'desc';
}

export interface PrismaQueryOptions {
  where?: PrismaWhereClause;
  orderBy?: PrismaOrderByClause | PrismaOrderByClause[];
  take?: number;
  skip?: number;
  select?: Record<string, boolean | object>;
}
