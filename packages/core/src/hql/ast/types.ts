/**
 * HOOPERITS CMS - HQL AST Type Definitions
 * Abstract Syntax Tree nodes for HQL queries
 */

// =============================================================================
// Base Node Interface
// =============================================================================

export interface ASTNode {
  type: string;
  start: number;
  end: number;
}

// =============================================================================
// Query Node (Root)
// =============================================================================

export interface QueryNode extends ASTNode {
  type: 'Query';
  source: SourceNode;
  operations: OperationNode[];
}

// =============================================================================
// Source Nodes
// =============================================================================

export interface EverythingNode extends ASTNode {
  type: 'Everything';
}

export interface ArrayLiteralNode extends ASTNode {
  type: 'ArrayLiteral';
  elements: ExpressionNode[];
}

export interface ObjectLiteralNode extends ASTNode {
  type: 'ObjectLiteral';
  properties: ObjectPropertyNode[];
}

export interface ObjectPropertyNode extends ASTNode {
  type: 'ObjectProperty';
  key: string;
  value: ExpressionNode;
}

export type SourceNode = EverythingNode | ArrayLiteralNode | ObjectLiteralNode | ExpressionNode;

// =============================================================================
// Operation Nodes
// =============================================================================

export interface FilterNode extends ASTNode {
  type: 'Filter';
  condition: ExpressionNode;
}

export interface ProjectionNode extends ASTNode {
  type: 'Projection';
  fields: ProjectionFieldNode[];
}

export interface SliceNode {
  type: 'Slice';
  start: number;
  end: number;
  inclusive: boolean;
  isSingleIndex: boolean;
  sourceStart?: number;
  sourceEnd?: number;
}

export interface PipeNode extends ASTNode {
  type: 'Pipe';
  function: PipeFunctionNode;
}

export type OperationNode = FilterNode | ProjectionNode | SliceNode | PipeNode;

// =============================================================================
// Expression Nodes
// =============================================================================

export type BinaryOperator =
  | '==' | '!=' | '>' | '<' | '>=' | '<='
  | '&&' | '||'
  | 'in' | 'match';

export interface BinaryExpressionNode extends ASTNode {
  type: 'BinaryExpression';
  operator: BinaryOperator;
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface UnaryExpressionNode extends ASTNode {
  type: 'UnaryExpression';
  operator: '!' | '-';
  argument: ExpressionNode;
}

export interface FieldAccessNode extends ASTNode {
  type: 'FieldAccess';
  path: string[];
}

export interface DereferenceNode extends ASTNode {
  type: 'Dereference';
  base: ExpressionNode;
  projection?: ProjectionNode;
}

export interface FunctionCallNode extends ASTNode {
  type: 'FunctionCall';
  name: string;
  namespace?: string;
  arguments: ExpressionNode[];
}

export interface LiteralNode extends ASTNode {
  type: 'Literal';
  value: string | number | boolean | null;
  kind: 'string' | 'number' | 'boolean' | 'null';
}

export interface ParameterNode extends ASTNode {
  type: 'Parameter';
  name: string;
}

export interface ParentScopeNode extends ASTNode {
  type: 'ParentScope';
  field?: FieldAccessNode;
}

export interface CurrentScopeNode extends ASTNode {
  type: 'CurrentScope';
  field?: FieldAccessNode;
}

export type ExpressionNode =
  | BinaryExpressionNode
  | UnaryExpressionNode
  | FieldAccessNode
  | DereferenceNode
  | FunctionCallNode
  | LiteralNode
  | ParameterNode
  | ParentScopeNode
  | CurrentScopeNode
  | ArrayLiteralNode
  | ObjectLiteralNode
  | EverythingNode;

// =============================================================================
// Projection Field Nodes
// =============================================================================

export interface SimpleFieldNode extends ASTNode {
  type: 'SimpleField';
  name: string;
}

export interface AliasedFieldNode extends ASTNode {
  type: 'AliasedField';
  alias: string;
  value: ExpressionNode;
}

export interface SpreadNode extends ASTNode {
  type: 'Spread';
  source?: ExpressionNode;
}

export type ProjectionFieldNode = SimpleFieldNode | AliasedFieldNode | SpreadNode;

// =============================================================================
// Pipe Function Nodes
// =============================================================================

export interface OrderFunctionNode extends ASTNode {
  type: 'OrderFunction';
  criteria: OrderCriterion[];
}

export interface OrderCriterion {
  field: FieldAccessNode;
  direction: 'asc' | 'desc';
}

export type PipeFunctionNode = OrderFunctionNode;

// =============================================================================
// Visitor Interface
// =============================================================================

export interface ASTVisitor<T = unknown> {
  visitQuery?(node: QueryNode): T;
  visitEverything?(node: EverythingNode): T;
  visitFilter?(node: FilterNode): T;
  visitProjection?(node: ProjectionNode): T;
  visitSlice?(node: SliceNode): T;
  visitPipe?(node: PipeNode): T;
  visitBinaryExpression?(node: BinaryExpressionNode): T;
  visitUnaryExpression?(node: UnaryExpressionNode): T;
  visitFieldAccess?(node: FieldAccessNode): T;
  visitDereference?(node: DereferenceNode): T;
  visitFunctionCall?(node: FunctionCallNode): T;
  visitLiteral?(node: LiteralNode): T;
  visitParameter?(node: ParameterNode): T;
  visitParentScope?(node: ParentScopeNode): T;
  visitCurrentScope?(node: CurrentScopeNode): T;
  visitArrayLiteral?(node: ArrayLiteralNode): T;
  visitObjectLiteral?(node: ObjectLiteralNode): T;
  visitSimpleField?(node: SimpleFieldNode): T;
  visitAliasedField?(node: AliasedFieldNode): T;
  visitSpread?(node: SpreadNode): T;
  visitOrderFunction?(node: OrderFunctionNode): T;
}

// =============================================================================
// AST Utilities
// =============================================================================

export function isExpressionNode(node: ASTNode): node is ExpressionNode {
  return [
    'BinaryExpression',
    'UnaryExpression',
    'FieldAccess',
    'Dereference',
    'FunctionCall',
    'Literal',
    'Parameter',
    'ParentScope',
    'CurrentScope',
    'ArrayLiteral',
    'ObjectLiteral',
    'Everything',
  ].includes(node.type);
}

export function isOperationNode(node: ASTNode): node is OperationNode {
  return ['Filter', 'Projection', 'Slice', 'Pipe'].includes(node.type);
}
