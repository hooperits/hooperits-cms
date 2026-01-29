/**
 * HOOPERITS CMS - HQL (HOOPERITS Query Language)
 * A GROQ-inspired query language for content retrieval
 */

// Main query function
export { query, parse } from './query';

// Types
export type {
  HQLQueryInput,
  HQLQueryOptions,
  HQLQueryResult,
  HQLQueryMeta,
} from './types';

// AST Types
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
  ASTVisitor,
} from './ast/types';

// Errors
export { HQLError, isHQLError } from './errors';
export type { HQLErrorCode, HQLErrorPosition } from './errors';

// Executor (for advanced usage)
export { HQLExecutor } from './executor/executor';
export type {
  ExecutionContext,
  ExecutionOptions,
  ExecutionResult,
} from './executor/types';
