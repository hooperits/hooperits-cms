/**
 * HOOPERITS CMS - HQL Query Cost Estimation
 * Estimate computational cost before query execution
 */

import type {
  QueryNode,
  OperationNode,
  ExpressionNode,
  FilterNode,
  ProjectionNode,
  SliceNode,
  PipeNode,
  DereferenceNode,
  FunctionCallNode,
  BinaryExpressionNode,
} from '../ast/types';

// =============================================================================
// Cost Constants
// =============================================================================

const COST_WEIGHTS = {
  // Base costs
  BASE_QUERY: 10,

  // Operation costs
  FILTER: 5,
  FILTER_CONDITION: 2,
  PROJECTION: 1,
  PROJECTION_FIELD: 1,
  SLICE: 0,
  ORDER: 20,

  // Expression costs
  BINARY_EXPRESSION: 1,
  UNARY_EXPRESSION: 1,
  FIELD_ACCESS: 1,

  // Advanced features
  DEREFERENCE: 50,
  DEREFERENCE_NESTED: 100,
  FUNCTION_CALL: 10,

  // Special operators
  MATCH_OPERATOR: 5,
  IN_OPERATOR: 3,

  // Literal costs (per element/property)
  ARRAY_ELEMENT: 1,
  OBJECT_PROPERTY: 2,
};

// =============================================================================
// Security Limits
// =============================================================================

/** Maximum elements in an array literal */
const MAX_ARRAY_LITERAL_SIZE = parseInt(process.env.HQL_MAX_ARRAY_SIZE || '1000', 10);

/** Maximum properties in an object literal */
const MAX_OBJECT_LITERAL_SIZE = parseInt(process.env.HQL_MAX_OBJECT_SIZE || '100', 10);

export class QueryCostError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QueryCostError';
  }
}

// =============================================================================
// Cost Calculation
// =============================================================================

export interface QueryCost {
  base: number;
  operations: number;
  expressions: number;
  references: number;
  functions: number;
  total: number;
}

export function estimateQueryCost(ast: QueryNode): number {
  const cost = calculateDetailedCost(ast);
  return cost.total;
}

export function calculateDetailedCost(ast: QueryNode): QueryCost {
  const cost: QueryCost = {
    base: COST_WEIGHTS.BASE_QUERY,
    operations: 0,
    expressions: 0,
    references: 0,
    functions: 0,
    total: 0,
  };

  // Calculate operation costs
  for (const operation of ast.operations) {
    const opCost = calculateOperationCost(operation);
    cost.operations += opCost.operations;
    cost.expressions += opCost.expressions;
    cost.references += opCost.references;
    cost.functions += opCost.functions;
  }

  cost.total = cost.base + cost.operations + cost.expressions + cost.references + cost.functions;

  return cost;
}

function calculateOperationCost(operation: OperationNode): Omit<QueryCost, 'base' | 'total'> {
  const cost = { operations: 0, expressions: 0, references: 0, functions: 0 };

  switch (operation.type) {
    case 'Filter':
      cost.operations += COST_WEIGHTS.FILTER;
      const filterExprCost = calculateExpressionCost(operation.condition);
      cost.expressions += filterExprCost.expressions;
      cost.references += filterExprCost.references;
      cost.functions += filterExprCost.functions;
      break;

    case 'Projection':
      cost.operations += COST_WEIGHTS.PROJECTION;
      for (const field of operation.fields) {
        cost.operations += COST_WEIGHTS.PROJECTION_FIELD;

        if (field.type === 'AliasedField') {
          const fieldCost = calculateExpressionCost(field.value);
          cost.expressions += fieldCost.expressions;
          cost.references += fieldCost.references;
          cost.functions += fieldCost.functions;
        } else if (field.type === 'Spread' && field.source) {
          const spreadCost = calculateExpressionCost(field.source);
          cost.expressions += spreadCost.expressions;
          cost.references += spreadCost.references;
          cost.functions += spreadCost.functions;
        }
      }
      break;

    case 'Slice':
      cost.operations += COST_WEIGHTS.SLICE;
      break;

    case 'Pipe':
      if (operation.function.type === 'OrderFunction') {
        cost.operations += COST_WEIGHTS.ORDER;
        cost.operations += operation.function.criteria.length * COST_WEIGHTS.FIELD_ACCESS;
      }
      break;
  }

  return cost;
}

function calculateExpressionCost(
  expr: ExpressionNode,
  depth: number = 0
): Omit<QueryCost, 'base' | 'total' | 'operations'> {
  const cost = { expressions: 0, references: 0, functions: 0 };

  switch (expr.type) {
    case 'BinaryExpression':
      cost.expressions += COST_WEIGHTS.BINARY_EXPRESSION;

      // Special operators have higher cost
      if (expr.operator === 'match') {
        cost.expressions += COST_WEIGHTS.MATCH_OPERATOR;
      } else if (expr.operator === 'in') {
        cost.expressions += COST_WEIGHTS.IN_OPERATOR;
      }

      const leftCost = calculateExpressionCost(expr.left, depth);
      const rightCost = calculateExpressionCost(expr.right, depth);

      cost.expressions += leftCost.expressions + rightCost.expressions;
      cost.references += leftCost.references + rightCost.references;
      cost.functions += leftCost.functions + rightCost.functions;
      break;

    case 'UnaryExpression':
      cost.expressions += COST_WEIGHTS.UNARY_EXPRESSION;
      const argCost = calculateExpressionCost(expr.argument, depth);
      cost.expressions += argCost.expressions;
      cost.references += argCost.references;
      cost.functions += argCost.functions;
      break;

    case 'FieldAccess':
      cost.expressions += COST_WEIGHTS.FIELD_ACCESS * expr.path.length;
      break;

    case 'Dereference':
      // Dereferences are expensive, and nested ones even more so
      cost.references += depth > 0 ? COST_WEIGHTS.DEREFERENCE_NESTED : COST_WEIGHTS.DEREFERENCE;

      const baseCost = calculateExpressionCost(expr.base, depth);
      cost.expressions += baseCost.expressions;
      cost.references += baseCost.references;
      cost.functions += baseCost.functions;

      // If there's a nested projection with references, calculate that cost too
      if (expr.projection) {
        for (const field of expr.projection.fields) {
          if (field.type === 'AliasedField') {
            const fieldCost = calculateExpressionCost(field.value, depth + 1);
            cost.expressions += fieldCost.expressions;
            cost.references += fieldCost.references;
            cost.functions += fieldCost.functions;
          }
        }
      }
      break;

    case 'FunctionCall':
      cost.functions += COST_WEIGHTS.FUNCTION_CALL;
      for (const arg of expr.arguments) {
        const argExprCost = calculateExpressionCost(arg, depth);
        cost.expressions += argExprCost.expressions;
        cost.references += argExprCost.references;
        cost.functions += argExprCost.functions;
      }
      break;

    case 'Literal':
    case 'Parameter':
    case 'CurrentScope':
    case 'ParentScope':
      // Minimal cost
      cost.expressions += 1;
      break;

    case 'ArrayLiteral':
      // Security: Limit array literal size to prevent memory exhaustion
      if (expr.elements.length > MAX_ARRAY_LITERAL_SIZE) {
        throw new QueryCostError(
          `Array literal exceeds maximum size of ${MAX_ARRAY_LITERAL_SIZE} elements`
        );
      }
      // Cost scales with array size
      cost.expressions += 1 + expr.elements.length * COST_WEIGHTS.ARRAY_ELEMENT;
      for (const elem of expr.elements) {
        const elemCost = calculateExpressionCost(elem, depth);
        cost.expressions += elemCost.expressions;
        cost.references += elemCost.references;
        cost.functions += elemCost.functions;
      }
      break;

    case 'ObjectLiteral':
      // Security: Limit object literal size to prevent memory exhaustion
      if (expr.properties.length > MAX_OBJECT_LITERAL_SIZE) {
        throw new QueryCostError(
          `Object literal exceeds maximum size of ${MAX_OBJECT_LITERAL_SIZE} properties`
        );
      }
      // Cost scales with object size
      cost.expressions += 1 + expr.properties.length * COST_WEIGHTS.OBJECT_PROPERTY;
      for (const prop of expr.properties) {
        const propCost = calculateExpressionCost(prop.value, depth);
        cost.expressions += propCost.expressions;
        cost.references += propCost.references;
        cost.functions += propCost.functions;
      }
      break;
  }

  return cost;
}

// =============================================================================
// Cost Validation
// =============================================================================

export function validateQueryCost(ast: QueryNode, maxCost: number): void {
  const cost = estimateQueryCost(ast);

  if (cost > maxCost) {
    throw new Error(`Query cost (${cost}) exceeds maximum allowed (${maxCost})`);
  }
}
