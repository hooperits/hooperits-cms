/**
 * HOOPERITS CMS - HQL CST to AST Visitor
 * Converts Chevrotain Concrete Syntax Tree to Abstract Syntax Tree
 */

import { CstNode, IToken } from 'chevrotain';
import { hqlParser } from './parser';
import type {
  QueryNode,
  ExpressionNode,
  OperationNode,
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
  EverythingNode,
  ArrayLiteralNode,
  ObjectLiteralNode,
  ProjectionFieldNode,
  SimpleFieldNode,
  AliasedFieldNode,
  SpreadNode,
  OrderFunctionNode,
  OrderCriterion,
  ParentScopeNode,
  CurrentScopeNode,
  BinaryOperator,
} from '../ast/types';

// Get the base visitor class from parser
const BaseCstVisitor = hqlParser.getBaseCstVisitorConstructor();

interface CstChildren {
  [key: string]: (CstNode | IToken)[];
}

class HQLAstVisitor extends BaseCstVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  query(ctx: CstChildren): QueryNode {
    const source = this.visit(ctx.source[0] as CstNode) as ExpressionNode;
    const operations: OperationNode[] = ctx.operation
      ? ctx.operation.map((op) => this.visit(op as CstNode) as OperationNode)
      : [];

    return {
      type: 'Query',
      source,
      operations,
      start: 0,
      end: 0,
    };
  }

  source(ctx: CstChildren): ExpressionNode {
    if (ctx.Star) {
      return this.createEverythingNode(ctx.Star[0] as IToken);
    }
    return this.visit(ctx.primaryExpression[0] as CstNode) as ExpressionNode;
  }

  operation(ctx: CstChildren): OperationNode {
    if (ctx.filterOperation) {
      return this.visit(ctx.filterOperation[0] as CstNode) as FilterNode;
    }
    if (ctx.projectionOperation) {
      return this.visit(ctx.projectionOperation[0] as CstNode) as ProjectionNode;
    }
    if (ctx.sliceOperation) {
      return this.visit(ctx.sliceOperation[0] as CstNode) as SliceNode;
    }
    if (ctx.pipeOperation) {
      return this.visit(ctx.pipeOperation[0] as CstNode) as PipeNode;
    }
    throw new Error('Unknown operation type');
  }

  filterOperation(ctx: CstChildren): FilterNode {
    const condition = this.visit(ctx.expression[0] as CstNode) as ExpressionNode;
    const lsquare = ctx.LSquare[0] as IToken;
    const rsquare = ctx.RSquare[0] as IToken;

    return {
      type: 'Filter',
      condition,
      start: lsquare.startOffset,
      end: rsquare.endOffset || rsquare.startOffset,
    };
  }

  projectionOperation(ctx: CstChildren): ProjectionNode {
    const fields: ProjectionFieldNode[] = ctx.projectionField
      ? ctx.projectionField.map((f) => this.visit(f as CstNode) as ProjectionFieldNode)
      : [];

    const lcurly = ctx.LCurly[0] as IToken;
    const rcurly = ctx.RCurly[0] as IToken;

    return {
      type: 'Projection',
      fields,
      start: lcurly.startOffset,
      end: rcurly.endOffset || rcurly.startOffset,
    };
  }

  sliceOperation(ctx: CstChildren): SliceNode {
    const numbers = ctx.NumberLiteral as IToken[];
    const startIndex = parseInt(numbers[0].image, 10);
    const lsquare = ctx.LSquare[0] as IToken;
    const rsquare = ctx.RSquare[0] as IToken;

    if (numbers.length === 1) {
      // Single index: [n]
      return {
        type: 'Slice',
        start: startIndex,
        end: startIndex,
        inclusive: true,
        isSingleIndex: true,
        sourceStart: lsquare.startOffset,
        sourceEnd: rsquare.endOffset || rsquare.startOffset,
      } as SliceNode;
    }

    const endIndex = parseInt(numbers[1].image, 10);
    const inclusive = Boolean(ctx.InclusiveRange);

    return {
      type: 'Slice',
      start: startIndex,
      end: endIndex,
      inclusive,
      isSingleIndex: false,
      sourceStart: lsquare.startOffset,
      sourceEnd: rsquare.endOffset || rsquare.startOffset,
    } as SliceNode;
  }

  pipeOperation(ctx: CstChildren): PipeNode {
    const func = this.visit(ctx.pipeFunction[0] as CstNode) as OrderFunctionNode;
    const pipe = ctx.Pipe[0] as IToken;

    return {
      type: 'Pipe',
      function: func,
      start: pipe.startOffset,
      end: func.end,
    };
  }

  pipeFunction(ctx: CstChildren): OrderFunctionNode {
    if (ctx.orderFunction) {
      return this.visit(ctx.orderFunction[0] as CstNode) as OrderFunctionNode;
    }
    throw new Error('Unknown pipe function');
  }

  orderFunction(ctx: CstChildren): OrderFunctionNode {
    const criteria: OrderCriterion[] = ctx.orderCriterion
      ? ctx.orderCriterion.map((c) => this.visit(c as CstNode) as OrderCriterion)
      : [];

    const order = ctx.Order[0] as IToken;
    const rparen = ctx.RParen[0] as IToken;

    return {
      type: 'OrderFunction',
      criteria,
      start: order.startOffset,
      end: rparen.endOffset || rparen.startOffset,
    };
  }

  orderCriterion(ctx: CstChildren): OrderCriterion {
    const field = this.visit(ctx.fieldPath[0] as CstNode) as FieldAccessNode;
    let direction: 'asc' | 'desc' = 'asc';

    if (ctx.Desc) {
      direction = 'desc';
    } else if (ctx.Asc) {
      direction = 'asc';
    }

    return { field, direction };
  }

  projectionField(ctx: CstChildren): ProjectionFieldNode {
    if (ctx.spreadField) {
      return this.visit(ctx.spreadField[0] as CstNode) as SpreadNode;
    }
    return this.visit(ctx.aliasedOrSimpleField[0] as CstNode) as ProjectionFieldNode;
  }

  spreadField(ctx: CstChildren): SpreadNode {
    const dots = ctx.Dot as IToken[];
    let source: ExpressionNode | undefined;

    if (ctx.expression) {
      source = this.visit(ctx.expression[0] as CstNode) as ExpressionNode;
    }

    return {
      type: 'Spread',
      source,
      start: dots[0].startOffset,
      end: source?.end || dots[2].endOffset || dots[2].startOffset,
    };
  }

  aliasedOrSimpleField(ctx: CstChildren): ProjectionFieldNode {
    if (ctx.StringLiteral && ctx.Colon) {
      // Aliased field: "alias": expression
      const alias = this.parseStringLiteral(ctx.StringLiteral[0] as IToken);
      const value = this.visit(ctx.expression[0] as CstNode) as ExpressionNode;
      const stringToken = ctx.StringLiteral[0] as IToken;

      return {
        type: 'AliasedField',
        alias,
        value,
        start: stringToken.startOffset,
        end: value.end,
      } as AliasedFieldNode;
    }

    return this.visit(ctx.fieldExpression[0] as CstNode) as ProjectionFieldNode;
  }

  fieldExpression(ctx: CstChildren): ProjectionFieldNode | ExpressionNode {
    const field = this.visit(ctx.fieldPath[0] as CstNode) as FieldAccessNode;

    if (ctx.Dereference) {
      let projection: ProjectionNode | undefined;
      if (ctx.projectionOperation) {
        projection = this.visit(ctx.projectionOperation[0] as CstNode) as ProjectionNode;
      }

      // Return as aliased field with dereference expression
      const dereference: DereferenceNode = {
        type: 'Dereference',
        base: field,
        projection,
        start: field.start,
        end: projection?.end || (ctx.Dereference[0] as IToken).endOffset || field.end,
      };

      // Use last field name as the implicit alias
      return {
        type: 'AliasedField',
        alias: field.path[field.path.length - 1],
        value: dereference,
        start: field.start,
        end: dereference.end,
      } as AliasedFieldNode;
    }

    // Simple field
    return {
      type: 'SimpleField',
      name: field.path.join('.'),
      start: field.start,
      end: field.end,
    } as SimpleFieldNode;
  }

  // Expression rules
  expression(ctx: CstChildren): ExpressionNode {
    return this.visit(ctx.orExpression[0] as CstNode) as ExpressionNode;
  }

  orExpression(ctx: CstChildren): ExpressionNode {
    let left = this.visit(ctx.andExpression[0] as CstNode) as ExpressionNode;

    if (ctx.andExpression.length > 1) {
      for (let i = 1; i < ctx.andExpression.length; i++) {
        const right = this.visit(ctx.andExpression[i] as CstNode) as ExpressionNode;
        left = {
          type: 'BinaryExpression',
          operator: '||',
          left,
          right,
          start: left.start,
          end: right.end,
        } as BinaryExpressionNode;
      }
    }

    return left;
  }

  andExpression(ctx: CstChildren): ExpressionNode {
    let left = this.visit(ctx.comparisonExpression[0] as CstNode) as ExpressionNode;

    if (ctx.comparisonExpression.length > 1) {
      for (let i = 1; i < ctx.comparisonExpression.length; i++) {
        const right = this.visit(ctx.comparisonExpression[i] as CstNode) as ExpressionNode;
        left = {
          type: 'BinaryExpression',
          operator: '&&',
          left,
          right,
          start: left.start,
          end: right.end,
        } as BinaryExpressionNode;
      }
    }

    return left;
  }

  comparisonExpression(ctx: CstChildren): ExpressionNode {
    const left = this.visit(ctx.unaryExpression[0] as CstNode) as ExpressionNode;

    if (ctx.unaryExpression.length > 1) {
      const right = this.visit(ctx.unaryExpression[1] as CstNode) as ExpressionNode;
      const operator = this.getComparisonOperator(ctx);

      return {
        type: 'BinaryExpression',
        operator,
        left,
        right,
        start: left.start,
        end: right.end,
      } as BinaryExpressionNode;
    }

    return left;
  }

  private getComparisonOperator(ctx: CstChildren): BinaryOperator {
    if (ctx.Equals) return '==';
    if (ctx.NotEquals) return '!=';
    if (ctx.GreaterThan) return '>';
    if (ctx.LessThan) return '<';
    if (ctx.GreaterThanOrEqual) return '>=';
    if (ctx.LessThanOrEqual) return '<=';
    if (ctx.In) return 'in';
    if (ctx.Match) return 'match';
    // Fail fast: unexpected operator should not happen if parser grammar is correct
    throw new Error('Internal parser error: unknown comparison operator in AST');
  }

  unaryExpression(ctx: CstChildren): ExpressionNode {
    const expr = this.visit(ctx.postfixExpression[0] as CstNode) as ExpressionNode;

    if (ctx.Not) {
      const notToken = ctx.Not[0] as IToken;
      return {
        type: 'UnaryExpression',
        operator: '!',
        argument: expr,
        start: notToken.startOffset,
        end: expr.end,
      } as UnaryExpressionNode;
    }

    return expr;
  }

  postfixExpression(ctx: CstChildren): ExpressionNode {
    let expr = this.visit(ctx.primaryExpression[0] as CstNode) as ExpressionNode;

    // Handle postfix operations (dereference, dot access, filter, projection)
    if (ctx.Dereference) {
      for (let i = 0; i < ctx.Dereference.length; i++) {
        const derefToken = ctx.Dereference[i] as IToken;
        let projection: ProjectionNode | undefined;

        if (ctx.projectionOperation && ctx.projectionOperation[i]) {
          projection = this.visit(ctx.projectionOperation[i] as CstNode) as ProjectionNode;
        }

        expr = {
          type: 'Dereference',
          base: expr,
          projection,
          start: expr.start,
          end: projection?.end || derefToken.endOffset || derefToken.startOffset,
        } as DereferenceNode;
      }
    }

    if (ctx.Dot && ctx.Identifier) {
      // Handle dot access
      for (let i = 0; i < ctx.Identifier.length; i++) {
        const idToken = ctx.Identifier[i] as IToken;
        if (expr.type === 'FieldAccess') {
          (expr as FieldAccessNode).path.push(idToken.image);
          expr.end = idToken.endOffset || idToken.startOffset;
        } else {
          expr = {
            type: 'FieldAccess',
            path: [idToken.image],
            start: expr.start,
            end: idToken.endOffset || idToken.startOffset,
          } as FieldAccessNode;
        }
      }
    }

    // Postfix filters on expressions are not yet supported
    // Users should use the standard *[condition] syntax instead
    if (ctx.filterOperation && ctx.filterOperation.length > 0) {
      throw new Error(
        'Postfix filter operations on expressions are not yet supported. ' +
          'Use *[condition] syntax at the query level instead.'
      );
    }

    return expr;
  }

  primaryExpression(ctx: CstChildren): ExpressionNode {
    if (ctx.functionCall) {
      return this.visit(ctx.functionCall[0] as CstNode) as FunctionCallNode;
    }
    if (ctx.literal) {
      return this.visit(ctx.literal[0] as CstNode) as LiteralNode;
    }
    if (ctx.parameter) {
      return this.visit(ctx.parameter[0] as CstNode) as ParameterNode;
    }
    if (ctx.scopeReference) {
      return this.visit(ctx.scopeReference[0] as CstNode) as ExpressionNode;
    }
    if (ctx.arrayLiteral) {
      return this.visit(ctx.arrayLiteral[0] as CstNode) as ArrayLiteralNode;
    }
    if (ctx.objectLiteral) {
      return this.visit(ctx.objectLiteral[0] as CstNode) as ObjectLiteralNode;
    }
    if (ctx.fieldPath) {
      return this.visit(ctx.fieldPath[0] as CstNode) as FieldAccessNode;
    }
    if (ctx.expression) {
      return this.visit(ctx.expression[0] as CstNode) as ExpressionNode;
    }

    throw new Error('Unknown primary expression');
  }

  functionCall(ctx: CstChildren): FunctionCallNode {
    const identifiers = ctx.Identifier as IToken[];
    let name: string;
    let namespace: string | undefined;

    if (identifiers.length === 2) {
      namespace = identifiers[0].image;
      name = identifiers[1].image;
    } else {
      name = identifiers[0].image;
    }

    const args: ExpressionNode[] = ctx.expression
      ? ctx.expression.map((e) => this.visit(e as CstNode) as ExpressionNode)
      : [];

    const firstId = identifiers[0];
    const rparen = ctx.RParen[0] as IToken;

    return {
      type: 'FunctionCall',
      name,
      namespace,
      arguments: args,
      start: firstId.startOffset,
      end: rparen.endOffset || rparen.startOffset,
    };
  }

  fieldPath(ctx: CstChildren): FieldAccessNode {
    const identifiers = ctx.Identifier as IToken[];
    const path = identifiers.map((id) => id.image);
    const first = identifiers[0];
    const last = identifiers[identifiers.length - 1];

    return {
      type: 'FieldAccess',
      path,
      start: first.startOffset,
      end: last.endOffset || last.startOffset,
    };
  }

  literal(ctx: CstChildren): LiteralNode {
    if (ctx.StringLiteral) {
      const token = ctx.StringLiteral[0] as IToken;
      return {
        type: 'Literal',
        value: this.parseStringLiteral(token),
        kind: 'string',
        start: token.startOffset,
        end: token.endOffset || token.startOffset,
      };
    }
    if (ctx.NumberLiteral) {
      const token = ctx.NumberLiteral[0] as IToken;
      const value = token.image.includes('.')
        ? parseFloat(token.image)
        : parseInt(token.image, 10);
      return {
        type: 'Literal',
        value,
        kind: 'number',
        start: token.startOffset,
        end: token.endOffset || token.startOffset,
      };
    }
    if (ctx.True) {
      const token = ctx.True[0] as IToken;
      return {
        type: 'Literal',
        value: true,
        kind: 'boolean',
        start: token.startOffset,
        end: token.endOffset || token.startOffset,
      };
    }
    if (ctx.False) {
      const token = ctx.False[0] as IToken;
      return {
        type: 'Literal',
        value: false,
        kind: 'boolean',
        start: token.startOffset,
        end: token.endOffset || token.startOffset,
      };
    }
    if (ctx.Null) {
      const token = ctx.Null[0] as IToken;
      return {
        type: 'Literal',
        value: null,
        kind: 'null',
        start: token.startOffset,
        end: token.endOffset || token.startOffset,
      };
    }

    throw new Error('Unknown literal type');
  }

  parameter(ctx: CstChildren): ParameterNode {
    const dollar = ctx.Dollar[0] as IToken;
    const id = ctx.Identifier[0] as IToken;

    return {
      type: 'Parameter',
      name: id.image,
      start: dollar.startOffset,
      end: id.endOffset || id.startOffset,
    };
  }

  scopeReference(ctx: CstChildren): ExpressionNode {
    if (ctx.At) {
      const at = ctx.At[0] as IToken;
      let field: FieldAccessNode | undefined;

      if (ctx.fieldPath) {
        field = this.visit(ctx.fieldPath[0] as CstNode) as FieldAccessNode;
      }

      return {
        type: 'CurrentScope',
        field,
        start: at.startOffset,
        end: field?.end || at.endOffset || at.startOffset,
      } as CurrentScopeNode;
    }

    if (ctx.Caret) {
      const caret = ctx.Caret[0] as IToken;
      let field: FieldAccessNode | undefined;

      if (ctx.fieldPath) {
        field = this.visit(ctx.fieldPath[0] as CstNode) as FieldAccessNode;
      }

      return {
        type: 'ParentScope',
        field,
        start: caret.startOffset,
        end: field?.end || caret.endOffset || caret.startOffset,
      } as ParentScopeNode;
    }

    throw new Error('Unknown scope reference');
  }

  arrayLiteral(ctx: CstChildren): ArrayLiteralNode {
    const elements: ExpressionNode[] = ctx.expression
      ? ctx.expression.map((e) => this.visit(e as CstNode) as ExpressionNode)
      : [];

    const lsquare = ctx.LSquare[0] as IToken;
    const rsquare = ctx.RSquare[0] as IToken;

    return {
      type: 'ArrayLiteral',
      elements,
      start: lsquare.startOffset,
      end: rsquare.endOffset || rsquare.startOffset,
    };
  }

  objectLiteral(ctx: CstChildren): ObjectLiteralNode {
    const properties = ctx.objectProperty
      ? ctx.objectProperty.map((p) => this.visit(p as CstNode))
      : [];

    const lcurly = ctx.LCurly[0] as IToken;
    const rcurly = ctx.RCurly[0] as IToken;

    return {
      type: 'ObjectLiteral',
      properties,
      start: lcurly.startOffset,
      end: rcurly.endOffset || rcurly.startOffset,
    };
  }

  objectProperty(ctx: CstChildren) {
    const key = ctx.StringLiteral
      ? this.parseStringLiteral(ctx.StringLiteral[0] as IToken)
      : (ctx.Identifier[0] as IToken).image;

    const value = this.visit(ctx.expression[0] as CstNode) as ExpressionNode;
    const keyToken = (ctx.StringLiteral?.[0] || ctx.Identifier[0]) as IToken;

    return {
      type: 'ObjectProperty',
      key,
      value,
      start: keyToken.startOffset,
      end: value.end,
    };
  }

  // Helpers
  private createEverythingNode(token: IToken): EverythingNode {
    return {
      type: 'Everything',
      start: token.startOffset,
      end: token.endOffset || token.startOffset,
    };
  }

  private parseStringLiteral(token: IToken): string {
    const raw = token.image;
    // Remove quotes and unescape
    return raw.slice(1, -1).replace(/\\(.)/g, '$1');
  }
}

// Export singleton visitor
export const hqlAstVisitor = new HQLAstVisitor();
