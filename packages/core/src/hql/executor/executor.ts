/**
 * HOOPERITS CMS - HQL Executor
 * Evaluates HQL AST against the database
 */

import { db } from '../../db';
import { transformContentToHQL } from './transform';
import type {
  QueryNode,
  ExpressionNode,
  FilterNode,
  ProjectionNode,
  SliceNode,
  PipeNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  FieldAccessNode,
  LiteralNode,
  ParameterNode,
  FunctionCallNode,
  DereferenceNode,
  OrderFunctionNode,
  ProjectionFieldNode,
  SimpleFieldNode,
  AliasedFieldNode,
  SpreadNode,
  EverythingNode,
  OperationNode,
} from '../ast/types';
import type {
  ExecutionContext,
  ExecutionResult,
  ExecutionMeta,
  PrismaWhereClause,
  PrismaOrderByClause,
  PrismaQueryOptions,
  ExecutionOptions,
} from './types';
import { DEFAULT_EXECUTION_OPTIONS } from './types';
import { createReferenceLoader } from './reference-loader';
import { getFunction, hasFunction } from './functions';

// =============================================================================
// HQL Executor Class
// =============================================================================

export class HQLExecutor {
  private options: ExecutionOptions;

  constructor(options: Partial<ExecutionOptions> = {}) {
    this.options = { ...DEFAULT_EXECUTION_OPTIONS, ...options };
  }

  async execute(
    ast: QueryNode,
    params: Record<string, unknown> = {}
  ): Promise<ExecutionResult> {
    // Create a reference loader for batched reference resolution
    const referenceLoader = createReferenceLoader();

    const context: ExecutionContext = {
      current: null,
      params,
      options: this.options,
      depth: 0,
      referenceLoader,
    };

    const data = await this.evaluateQuery(ast, context);
    const meta: ExecutionMeta = {
      scannedCount: Array.isArray(data) ? data.length : 1,
      returnedCount: Array.isArray(data) ? data.length : 1,
      cost: this.estimateCost(ast),
      depth: context.depth,
    };

    // Clear reference loader cache
    referenceLoader.clear();

    return { data, meta };
  }

  // ===========================================================================
  // Query Evaluation
  // ===========================================================================

  private async evaluateQuery(
    node: QueryNode,
    context: ExecutionContext
  ): Promise<unknown> {
    // Start with source (usually * for all documents)
    let result = await this.evaluateSource(node.source, context);

    // Look ahead for optimization opportunities
    const optimizationContext = this.analyzeOperations(node.operations);

    // Apply operations in sequence
    for (let i = 0; i < node.operations.length; i++) {
      const operation = node.operations[i];

      // Skip operations that were already applied at database level
      if (optimizationContext.appliedAtDbLevel.has(i)) {
        continue;
      }

      // For filter operations from "everything", pass pending order/slice for DB optimization
      if (operation.type === 'Filter' && result && typeof result === 'object' && '_isEverything' in result) {
        result = await this.evaluateFilter(
          operation,
          result,
          context,
          optimizationContext.pendingOrder,
          optimizationContext.pendingSlice
        );
        // Mark order and slice as applied at DB level
        if (optimizationContext.orderIndex !== undefined) {
          optimizationContext.appliedAtDbLevel.add(optimizationContext.orderIndex);
        }
        if (optimizationContext.sliceIndex !== undefined && optimizationContext.orderIndex !== undefined) {
          // Only skip slice if ordering was also applied at DB level
          optimizationContext.appliedAtDbLevel.add(optimizationContext.sliceIndex);
        }
      } else {
        result = await this.evaluateOperation(operation, result, context);
      }
    }

    return result;
  }

  private analyzeOperations(operations: OperationNode[]): {
    pendingOrder?: OrderFunctionNode;
    pendingSlice?: SliceNode;
    orderIndex?: number;
    sliceIndex?: number;
    appliedAtDbLevel: Set<number>;
  } {
    let pendingOrder: OrderFunctionNode | undefined;
    let pendingSlice: SliceNode | undefined;
    let orderIndex: number | undefined;
    let sliceIndex: number | undefined;

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      if (op.type === 'Pipe' && op.function.type === 'OrderFunction' && !pendingOrder) {
        pendingOrder = op.function;
        orderIndex = i;
      }
      if (op.type === 'Slice' && !pendingSlice) {
        pendingSlice = op;
        sliceIndex = i;
      }
    }

    return {
      pendingOrder,
      pendingSlice,
      orderIndex,
      sliceIndex,
      appliedAtDbLevel: new Set(),
    };
  }

  private async evaluateSource(
    node: ExpressionNode,
    context: ExecutionContext
  ): Promise<unknown> {
    if (node.type === 'Everything') {
      // * - will be filtered by subsequent operations
      return { _isEverything: true };
    }
    return this.evaluateExpression(node, context);
  }

  private async evaluateOperation(
    node: OperationNode,
    input: unknown,
    context: ExecutionContext
  ): Promise<unknown> {
    switch (node.type) {
      case 'Filter':
        return this.evaluateFilter(node, input, context);
      case 'Projection':
        return this.evaluateProjection(node, input, context);
      case 'Slice':
        return this.evaluateSlice(node, input, context);
      case 'Pipe':
        return this.evaluatePipe(node, input, context);
      default:
        throw new Error(`Unknown operation type: ${(node as OperationNode).type}`);
    }
  }

  // ===========================================================================
  // Filter Evaluation
  // ===========================================================================

  async evaluateFilter(
    node: FilterNode,
    input: unknown,
    context: ExecutionContext,
    pendingOrder?: OrderFunctionNode,
    pendingSlice?: SliceNode
  ): Promise<unknown[]> {
    // Build Prisma where clause from filter condition
    const prismaOptions = this.buildPrismaQuery(node.condition, context);

    // If input is "everything", query the database
    if (input && typeof input === 'object' && '_isEverything' in input) {
      // Apply database-level ordering if available
      if (pendingOrder) {
        prismaOptions.orderBy = this.buildOrderByClause(pendingOrder);
      }

      // Apply database-level pagination if available
      if (pendingSlice && !pendingSlice.isSingleIndex) {
        prismaOptions.skip = pendingSlice.start;
        prismaOptions.take = pendingSlice.inclusive
          ? pendingSlice.end - pendingSlice.start + 1
          : pendingSlice.end - pendingSlice.start;
      }

      const results = await db.content.findMany({
        where: prismaOptions.where,
        orderBy: prismaOptions.orderBy,
        skip: prismaOptions.skip,
        take: prismaOptions.take,
        include: {
          type: { select: { id: true, name: true, label: true } },
        },
      });

      // Transform results to HQL format
      return results.map((item) => transformContentToHQL(item));
    }

    // If input is already an array, filter it in memory
    if (Array.isArray(input)) {
      const filtered: unknown[] = [];
      for (const item of input) {
        const matches = await this.evaluateCondition(node.condition, item, context);
        if (matches) {
          filtered.push(item);
        }
      }
      return filtered;
    }

    return [];
  }

  private buildOrderByClause(node: OrderFunctionNode): PrismaOrderByClause[] {
    return node.criteria.map((criterion): PrismaOrderByClause => {
      const fieldName = criterion.field.path[0];
      // Map HQL fields to Prisma fields
      if (fieldName === '_createdAt') {
        return { createdAt: criterion.direction } as PrismaOrderByClause;
      }
      if (fieldName === '_updatedAt') {
        return { updatedAt: criterion.direction } as PrismaOrderByClause;
      }
      // For data fields, we need JSON ordering (limited support in some DBs)
      return { [fieldName]: criterion.direction } as PrismaOrderByClause;
    });
  }

  private buildPrismaQuery(
    condition: ExpressionNode,
    context: ExecutionContext
  ): PrismaQueryOptions {
    const where = this.buildWhereClause(condition, context);
    return { where };
  }

  private buildWhereClause(
    node: ExpressionNode,
    context: ExecutionContext
  ): PrismaWhereClause {
    switch (node.type) {
      case 'BinaryExpression':
        return this.buildBinaryWhereClause(node, context);
      default:
        return {};
    }
  }

  private buildBinaryWhereClause(
    node: BinaryExpressionNode,
    context: ExecutionContext
  ): PrismaWhereClause {
    // Handle _type == "typename" specially
    if (
      node.left.type === 'FieldAccess' &&
      node.left.path[0] === '_type' &&
      node.operator === '==' &&
      node.right.type === 'Literal'
    ) {
      context.contentType = String(node.right.value);
      return {
        type: { name: String(node.right.value) },
      };
    }

    // Handle logical operators
    if (node.operator === '&&') {
      const left = this.buildWhereClause(node.left, context);
      const right = this.buildWhereClause(node.right, context);
      return { AND: [left, right] };
    }

    if (node.operator === '||') {
      const left = this.buildWhereClause(node.left, context);
      const right = this.buildWhereClause(node.right, context);
      return { OR: [left, right] };
    }

    // Handle field comparisons on data JSON
    if (node.left.type === 'FieldAccess' && node.right.type === 'Literal') {
      const fieldPath = node.left.path.join('.');
      const value = node.right.value;

      // For JSON fields, we need to use Prisma's JSON filtering
      return {
        data: {
          path: node.left.path,
          [this.getPrismaOperator(node.operator)]: value,
        },
      };
    }

    return {};
  }

  private getPrismaOperator(op: string): string {
    const operators: Record<string, string> = {
      '==': 'equals',
      '!=': 'not',
      '>': 'gt',
      '<': 'lt',
      '>=': 'gte',
      '<=': 'lte',
    };
    return operators[op] || 'equals';
  }

  private async evaluateCondition(
    node: ExpressionNode,
    item: unknown,
    context: ExecutionContext
  ): Promise<boolean> {
    const contextWithItem = { ...context, current: item };
    const result = await this.evaluateExpression(node, contextWithItem);
    return Boolean(result);
  }

  // ===========================================================================
  // Projection Evaluation
  // ===========================================================================

  async evaluateProjection(
    node: ProjectionNode,
    input: unknown,
    context: ExecutionContext
  ): Promise<unknown> {
    if (Array.isArray(input)) {
      return Promise.all(
        input.map((item) => this.projectItem(node, item, context))
      );
    }
    return this.projectItem(node, input, context);
  }

  private async projectItem(
    node: ProjectionNode,
    item: unknown,
    context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    const contextWithItem = { ...context, current: item };

    for (const field of node.fields) {
      await this.evaluateProjectionField(field, item, result, contextWithItem);
    }

    return result;
  }

  private async evaluateProjectionField(
    field: ProjectionFieldNode,
    item: unknown,
    result: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<void> {
    switch (field.type) {
      case 'SimpleField': {
        // Handle nested fields like "nested.field"
        const parts = field.name.split('.');
        result[parts[parts.length - 1]] = this.getFieldValue(item, parts);
        break;
      }

      case 'AliasedField': {
        // Check if the value is a dereference that needs resolution
        if (field.value.type === 'Dereference') {
          const resolved = await this.evaluateDereference(field.value, context);
          result[field.alias] = resolved;
        } else {
          result[field.alias] = await this.evaluateExpression(field.value, context);
        }
        break;
      }

      case 'Spread':
        if (field.source) {
          const sourceValue = await this.evaluateExpression(field.source, context);
          if (sourceValue && typeof sourceValue === 'object') {
            // Don't spread internal fields
            const { _id, _type, _createdAt, _updatedAt, ...rest } = sourceValue as Record<string, unknown>;
            Object.assign(result, rest);
          }
        } else if (item && typeof item === 'object') {
          // Spread all fields from current item
          const itemObj = item as Record<string, unknown>;
          for (const [key, value] of Object.entries(itemObj)) {
            // Skip internal fields from spread unless they're explicitly requested
            if (!key.startsWith('_') || key === '_id' || key === '_type') {
              result[key] = value;
            }
          }
        }
        break;
    }
  }

  // ===========================================================================
  // Slice Evaluation
  // ===========================================================================

  evaluateSlice(
    node: SliceNode,
    input: unknown,
    _context: ExecutionContext
  ): unknown {
    if (!Array.isArray(input)) {
      return node.isSingleIndex ? null : [];
    }

    if (node.isSingleIndex) {
      return input[node.start] ?? null;
    }

    const endIndex = node.inclusive ? node.end + 1 : node.end;
    return input.slice(node.start, endIndex);
  }

  // ===========================================================================
  // Pipe Evaluation
  // ===========================================================================

  async evaluatePipe(
    node: PipeNode,
    input: unknown,
    context: ExecutionContext
  ): Promise<unknown> {
    switch (node.function.type) {
      case 'OrderFunction':
        return this.evaluateOrder(node.function, input, context);
      default:
        return input;
    }
  }

  evaluateOrder(
    node: OrderFunctionNode,
    input: unknown,
    _context: ExecutionContext
  ): unknown {
    if (!Array.isArray(input)) {
      return input;
    }

    return [...input].sort((a, b) => {
      for (const criterion of node.criteria) {
        const fieldPath = criterion.field.path;
        const aValue = this.getFieldValue(a, fieldPath);
        const bValue = this.getFieldValue(b, fieldPath);

        let comparison = 0;
        if ((aValue as string | number) < (bValue as string | number)) comparison = -1;
        else if ((aValue as string | number) > (bValue as string | number)) comparison = 1;

        if (comparison !== 0) {
          return criterion.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  // ===========================================================================
  // Expression Evaluation
  // ===========================================================================

  async evaluateExpression(
    node: ExpressionNode,
    context: ExecutionContext
  ): Promise<unknown> {
    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'FieldAccess':
        return this.evaluateFieldAccess(node, context);

      case 'BinaryExpression':
        return this.evaluateBinaryExpression(node, context);

      case 'UnaryExpression':
        return this.evaluateUnaryExpression(node, context);

      case 'Parameter':
        return this.evaluateParameter(node, context);

      case 'FunctionCall':
        return this.evaluateFunctionCall(node, context);

      case 'Dereference':
        return this.evaluateDereference(node, context);

      case 'CurrentScope':
        return context.current;

      case 'ParentScope':
        return context.parent;

      default:
        return null;
    }
  }

  evaluateFieldAccess(
    node: FieldAccessNode,
    context: ExecutionContext
  ): unknown {
    return this.getFieldValue(context.current, node.path);
  }

  async evaluateBinaryExpression(
    node: BinaryExpressionNode,
    context: ExecutionContext
  ): Promise<unknown> {
    const left = await this.evaluateExpression(node.left, context);
    const right = await this.evaluateExpression(node.right, context);

    switch (node.operator) {
      case '==':
        return left === right;
      case '!=':
        return left !== right;
      case '>':
        return (left as number) > (right as number);
      case '<':
        return (left as number) < (right as number);
      case '>=':
        return (left as number) >= (right as number);
      case '<=':
        return (left as number) <= (right as number);
      case '&&':
        return Boolean(left) && Boolean(right);
      case '||':
        return Boolean(left) || Boolean(right);
      case 'in':
        return Array.isArray(right) && right.includes(left);
      case 'match':
        return this.evaluateMatch(left, right);
      default:
        return null;
    }
  }

  async evaluateUnaryExpression(
    node: UnaryExpressionNode,
    context: ExecutionContext
  ): Promise<unknown> {
    const value = await this.evaluateExpression(node.argument, context);

    switch (node.operator) {
      case '!':
        return !value;
      case '-':
        return -(value as number);
      default:
        return null;
    }
  }

  evaluateParameter(
    node: ParameterNode,
    context: ExecutionContext
  ): unknown {
    return context.params[node.name];
  }

  async evaluateFunctionCall(
    node: FunctionCallNode,
    context: ExecutionContext
  ): Promise<unknown> {
    const func = getFunction(node.name, node.namespace);

    if (!func) {
      const funcName = node.namespace ? `${node.namespace}::${node.name}` : node.name;
      throw new Error(`Unknown function: ${funcName}`);
    }

    // Evaluate all arguments
    const evaluatedArgs = await Promise.all(
      node.arguments.map((arg) => this.evaluateExpression(arg, context))
    );

    // Call the function
    return func(evaluatedArgs, context);
  }

  async evaluateDereference(
    node: DereferenceNode,
    context: ExecutionContext
  ): Promise<unknown> {
    // Check depth limit to prevent infinite recursion
    if (context.depth >= context.options.maxDepth) {
      return null;
    }

    const baseValue = await this.evaluateExpression(node.base, context);

    if (!baseValue || typeof baseValue !== 'object') {
      return null;
    }

    // Handle arrays of references
    if (Array.isArray(baseValue)) {
      const results = await Promise.all(
        baseValue.map(async (item) => {
          if (!item || typeof item !== 'object') return item;
          const ref = (item as Record<string, unknown>)._ref;
          if (!ref) return item;
          return this.resolveReference(String(ref), node, context);
        })
      );
      return results;
    }

    // Check for reference ID
    const ref = (baseValue as Record<string, unknown>)._ref;
    if (!ref) {
      return baseValue;
    }

    return this.resolveReference(String(ref), node, context);
  }

  private async resolveReference(
    refId: string,
    node: DereferenceNode,
    context: ExecutionContext
  ): Promise<unknown> {
    // Create child context with incremented depth
    const childContext: ExecutionContext = {
      ...context,
      depth: context.depth + 1,
    };

    // Load referenced document using batched loader
    let resolved: unknown = null;

    if (context.referenceLoader) {
      resolved = await context.referenceLoader.load(refId);
    } else {
      // Fallback: direct database query
      const content = await db.content.findUnique({
        where: { id: refId },
        include: { type: true },
      });
      resolved = content ? transformContentToHQL(content) : null;
    }

    if (!resolved) {
      return null;
    }

    // Apply projection if specified (e.g., author->{name, avatar})
    if (node.projection) {
      const projectionContext: ExecutionContext = {
        ...childContext,
        current: resolved,
      };
      return this.projectItem(node.projection, resolved, projectionContext);
    }

    return resolved;
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private getFieldValue(obj: unknown, path: string[]): unknown {
    if (!obj || typeof obj !== 'object') {
      return undefined;
    }

    let current: unknown = obj;
    for (const key of path) {
      if (current === null || current === undefined) {
        return undefined;
      }

      // Handle special HQL fields
      if (key === '_id') {
        current = (current as Record<string, unknown>).id ?? (current as Record<string, unknown>)._id;
      } else if (key === '_type') {
        const type = (current as Record<string, unknown>).type;
        current = typeof type === 'object' ? (type as Record<string, unknown>).name : type;
      } else {
        // Try direct field first, then data field
        const record = current as Record<string, unknown>;
        if (key in record) {
          current = record[key];
        } else if (record.data && typeof record.data === 'object') {
          current = (record.data as Record<string, unknown>)[key];
        } else {
          current = undefined;
        }
      }
    }

    return current;
  }

  private evaluateMatch(left: unknown, right: unknown): boolean {
    if (typeof left !== 'string' || typeof right !== 'string') {
      return false;
    }

    // Convert pattern to regex
    // * matches any characters
    const pattern = right
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');

    const regex = new RegExp(`^${pattern}$`, 'i');
    return regex.test(left);
  }

  private estimateCost(ast: QueryNode): number {
    let cost = 10; // Base cost

    for (const op of ast.operations) {
      switch (op.type) {
        case 'Filter':
          cost += 5;
          break;
        case 'Projection':
          cost += op.fields.length;
          break;
        case 'Slice':
          cost += 0;
          break;
        case 'Pipe':
          cost += 20;
          break;
      }
    }

    return cost;
  }
}

// Export singleton
export const executor = new HQLExecutor();
