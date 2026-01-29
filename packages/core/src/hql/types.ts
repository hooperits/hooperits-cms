/**
 * HOOPERITS CMS - HQL Types
 * Public types for HQL queries
 */

// Re-export AST types
export type {
  ASTNode,
  QueryNode,
  ExpressionNode,
  FilterNode,
  ProjectionNode,
  SliceNode,
  PipeNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  FieldAccessNode,
  DereferenceNode,
  FunctionCallNode,
  LiteralNode,
  ParameterNode,
} from './ast/types';

// =============================================================================
// Query Input Types
// =============================================================================

export interface HQLQueryInput {
  /** The HQL query string */
  query: string;

  /** Parameters to substitute in query */
  params?: Record<string, unknown>;

  /** Query options */
  options?: HQLQueryOptions;
}

export interface HQLQueryOptions {
  /** Maximum reference depth (default: 5) */
  maxDepth?: number;

  /** Maximum query cost before rejection (default: 1000) */
  maxCost?: number;

  /** Cache TTL in seconds (default: 60) */
  cacheTTL?: number;

  /** Skip cache lookup */
  noCache?: boolean;

  /** Query timeout in milliseconds (default: 30000) */
  timeout?: number;
}

// =============================================================================
// Query Result Types
// =============================================================================

export interface HQLQueryResult<T = unknown> {
  /** Query result data */
  data: T;

  /** Query metadata */
  meta: HQLQueryMeta;
}

export interface HQLQueryMeta {
  /** Time to parse query (ms) */
  parseTime: number;

  /** Time to execute query (ms) */
  executeTime: number;

  /** Total time (ms) */
  totalTime: number;

  /** Estimated query cost */
  cost: number;

  /** Whether result was from cache */
  cached: boolean;

  /** Number of documents scanned */
  scannedCount: number;

  /** Number of documents returned */
  returnedCount: number;
}
