/**
 * HOOPERITS CMS - HQL Parser
 * Concrete Syntax Tree parser for HQL queries
 */

import { CstParser, CstNode, IToken } from 'chevrotain';
import {
  allTokens,
  Star,
  LSquare,
  RSquare,
  LCurly,
  RCurly,
  LParen,
  RParen,
  Pipe,
  Dot,
  Comma,
  Colon,
  Dollar,
  Caret,
  At,
  Equals,
  NotEquals,
  GreaterThan,
  LessThan,
  GreaterThanOrEqual,
  LessThanOrEqual,
  And,
  Or,
  Not,
  In,
  Match,
  Dereference,
  InclusiveRange,
  ExclusiveRange,
  True,
  False,
  Null,
  Order,
  Asc,
  Desc,
  Identifier,
  StringLiteral,
  NumberLiteral,
} from './tokens';

export class HQLParser extends CstParser {
  constructor() {
    super(allTokens, {
      recoveryEnabled: true,
      maxLookahead: 4,
    });
    this.performSelfAnalysis();
  }

  // ==========================================================================
  // Entry Point
  // ==========================================================================

  public query = this.RULE('query', () => {
    this.SUBRULE(this.source);
    this.MANY(() => {
      this.SUBRULE(this.operation);
    });
  });

  // ==========================================================================
  // Source Rules
  // ==========================================================================

  private source = this.RULE('source', () => {
    this.OR([
      { ALT: () => this.CONSUME(Star) },
      { ALT: () => this.SUBRULE(this.primaryExpression) },
    ]);
  });

  // ==========================================================================
  // Operation Rules
  // ==========================================================================

  private operation = this.RULE('operation', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.filterOperation) },
      { ALT: () => this.SUBRULE(this.projectionOperation) },
      { ALT: () => this.SUBRULE(this.sliceOperation) },
      { ALT: () => this.SUBRULE(this.pipeOperation) },
    ]);
  });

  // Filter: [condition]
  private filterOperation = this.RULE('filterOperation', () => {
    this.CONSUME(LSquare);
    this.SUBRULE(this.expression);
    this.CONSUME(RSquare);
  });

  // Projection: {field1, field2, ...}
  private projectionOperation = this.RULE('projectionOperation', () => {
    this.CONSUME(LCurly);
    this.OPTION(() => {
      this.SUBRULE(this.projectionField);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.projectionField);
      });
    });
    this.CONSUME(RCurly);
  });

  // Slice: [n..m] or [n...m] or [n]
  private sliceOperation = this.RULE('sliceOperation', () => {
    this.CONSUME(LSquare);
    this.CONSUME(NumberLiteral);
    this.OPTION(() => {
      this.OR([
        { ALT: () => this.CONSUME(InclusiveRange) },
        { ALT: () => this.CONSUME(ExclusiveRange) },
      ]);
      this.CONSUME2(NumberLiteral);
    });
    this.CONSUME(RSquare);
  });

  // Pipe: | function()
  private pipeOperation = this.RULE('pipeOperation', () => {
    this.CONSUME(Pipe);
    this.SUBRULE(this.pipeFunction);
  });

  // ==========================================================================
  // Pipe Functions
  // ==========================================================================

  private pipeFunction = this.RULE('pipeFunction', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.orderFunction) },
    ]);
  });

  // order(field asc/desc, ...)
  private orderFunction = this.RULE('orderFunction', () => {
    this.CONSUME(Order);
    this.CONSUME(LParen);
    this.SUBRULE(this.orderCriterion);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.orderCriterion);
    });
    this.CONSUME(RParen);
  });

  private orderCriterion = this.RULE('orderCriterion', () => {
    this.SUBRULE(this.fieldPath);
    this.OPTION(() => {
      this.OR([
        { ALT: () => this.CONSUME(Asc) },
        { ALT: () => this.CONSUME(Desc) },
      ]);
    });
  });

  // ==========================================================================
  // Projection Fields
  // ==========================================================================

  private projectionField = this.RULE('projectionField', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.spreadField) },
      { ALT: () => this.SUBRULE(this.aliasedOrSimpleField) },
    ]);
  });

  // ... or ...(expression)
  private spreadField = this.RULE('spreadField', () => {
    this.CONSUME(Dot);
    this.CONSUME2(Dot);
    this.CONSUME3(Dot);
    this.OPTION(() => {
      this.CONSUME(LParen);
      this.SUBRULE(this.expression);
      this.CONSUME(RParen);
    });
  });

  // "alias": expression or fieldName or fieldName->
  private aliasedOrSimpleField = this.RULE('aliasedOrSimpleField', () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(StringLiteral);
          this.CONSUME(Colon);
          this.SUBRULE(this.expression);
        },
      },
      {
        ALT: () => {
          this.SUBRULE(this.fieldExpression);
        },
      },
    ]);
  });

  // Field with optional dereference and projection
  private fieldExpression = this.RULE('fieldExpression', () => {
    this.SUBRULE(this.fieldPath);
    this.OPTION(() => {
      this.CONSUME(Dereference);
      this.OPTION2(() => {
        this.SUBRULE(this.projectionOperation);
      });
    });
  });

  // ==========================================================================
  // Expression Rules
  // ==========================================================================

  private expression = this.RULE('expression', () => {
    this.SUBRULE(this.orExpression);
  });

  private orExpression = this.RULE('orExpression', () => {
    this.SUBRULE(this.andExpression);
    this.MANY(() => {
      this.CONSUME(Or);
      this.SUBRULE2(this.andExpression);
    });
  });

  private andExpression = this.RULE('andExpression', () => {
    this.SUBRULE(this.comparisonExpression);
    this.MANY(() => {
      this.CONSUME(And);
      this.SUBRULE2(this.comparisonExpression);
    });
  });

  private comparisonExpression = this.RULE('comparisonExpression', () => {
    this.SUBRULE(this.unaryExpression);
    this.OPTION(() => {
      this.OR([
        { ALT: () => this.CONSUME(Equals) },
        { ALT: () => this.CONSUME(NotEquals) },
        { ALT: () => this.CONSUME(GreaterThan) },
        { ALT: () => this.CONSUME(LessThan) },
        { ALT: () => this.CONSUME(GreaterThanOrEqual) },
        { ALT: () => this.CONSUME(LessThanOrEqual) },
        { ALT: () => this.CONSUME(In) },
        { ALT: () => this.CONSUME(Match) },
      ]);
      this.SUBRULE2(this.unaryExpression);
    });
  });

  private unaryExpression = this.RULE('unaryExpression', () => {
    this.OPTION(() => {
      this.CONSUME(Not);
    });
    this.SUBRULE(this.postfixExpression);
  });

  private postfixExpression = this.RULE('postfixExpression', () => {
    this.SUBRULE(this.primaryExpression);
    this.MANY(() => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(Dereference);
            this.OPTION(() => {
              this.SUBRULE(this.projectionOperation);
            });
          },
        },
        {
          ALT: () => {
            this.CONSUME(Dot);
            this.CONSUME(Identifier);
          },
        },
        {
          ALT: () => {
            this.SUBRULE(this.filterOperation);
          },
        },
        {
          ALT: () => {
            this.SUBRULE2(this.projectionOperation);
          },
        },
      ]);
    });
  });

  // ==========================================================================
  // Primary Expressions
  // ==========================================================================

  private primaryExpression = this.RULE('primaryExpression', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.functionCall) },
      { ALT: () => this.SUBRULE(this.literal) },
      { ALT: () => this.SUBRULE(this.parameter) },
      { ALT: () => this.SUBRULE(this.scopeReference) },
      { ALT: () => this.SUBRULE(this.arrayLiteral) },
      { ALT: () => this.SUBRULE(this.objectLiteral) },
      { ALT: () => this.SUBRULE(this.fieldPath) },
      {
        ALT: () => {
          this.CONSUME(LParen);
          this.SUBRULE(this.expression);
          this.CONSUME(RParen);
        },
      },
    ]);
  });

  // Function call: name(args) or namespace::name(args)
  private functionCall = this.RULE('functionCall', () => {
    this.CONSUME(Identifier);
    this.OPTION(() => {
      this.CONSUME(Colon);
      this.CONSUME2(Colon);
      this.CONSUME2(Identifier);
    });
    this.CONSUME(LParen);
    this.OPTION2(() => {
      this.SUBRULE(this.expression);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.expression);
      });
    });
    this.CONSUME(RParen);
  });

  // Field path: _type, nested.field
  private fieldPath = this.RULE('fieldPath', () => {
    this.CONSUME(Identifier);
    this.MANY(() => {
      this.CONSUME(Dot);
      this.CONSUME2(Identifier);
    });
  });

  // Literals
  private literal = this.RULE('literal', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(True) },
      { ALT: () => this.CONSUME(False) },
      { ALT: () => this.CONSUME(Null) },
    ]);
  });

  // Parameter: $paramName
  private parameter = this.RULE('parameter', () => {
    this.CONSUME(Dollar);
    this.CONSUME(Identifier);
  });

  // Scope references: @ or ^
  private scopeReference = this.RULE('scopeReference', () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(At);
          this.OPTION(() => {
            this.CONSUME(Dot);
            this.SUBRULE(this.fieldPath);
          });
        },
      },
      {
        ALT: () => {
          this.CONSUME(Caret);
          this.OPTION2(() => {
            this.CONSUME2(Dot);
            this.SUBRULE2(this.fieldPath);
          });
        },
      },
    ]);
  });

  // Array literal: [elem1, elem2, ...]
  private arrayLiteral = this.RULE('arrayLiteral', () => {
    this.CONSUME(LSquare);
    this.OPTION(() => {
      this.SUBRULE(this.expression);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.expression);
      });
    });
    this.CONSUME(RSquare);
  });

  // Object literal: {"key": value, ...}
  private objectLiteral = this.RULE('objectLiteral', () => {
    this.CONSUME(LCurly);
    this.OPTION(() => {
      this.SUBRULE(this.objectProperty);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.objectProperty);
      });
    });
    this.CONSUME(RCurly);
  });

  private objectProperty = this.RULE('objectProperty', () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(StringLiteral);
          this.CONSUME(Colon);
          this.SUBRULE(this.expression);
        },
      },
      {
        ALT: () => {
          this.CONSUME(Identifier);
          this.CONSUME2(Colon);
          this.SUBRULE2(this.expression);
        },
      },
    ]);
  });
}

// Singleton parser instance
export const hqlParser = new HQLParser();

// Export CST types
export type QueryCst = CstNode;
export type FilterCst = CstNode;
export type ProjectionCst = CstNode;
export type ExpressionCst = CstNode;
