/**
 * HOOPERITS CMS - HQL Errors
 * Error types for HQL query processing
 */

export type HQLErrorCode =
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'EXECUTION_ERROR'
  | 'COST_EXCEEDED'
  | 'DEPTH_EXCEEDED'
  | 'TIMEOUT'
  | 'UNKNOWN_TYPE'
  | 'UNKNOWN_FIELD'
  | 'INVALID_PARAM';

export interface HQLErrorPosition {
  line: number;
  column: number;
  offset: number;
}

export class HQLError extends Error {
  public readonly code: HQLErrorCode;
  public readonly position?: HQLErrorPosition;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: HQLErrorCode,
    message: string,
    position?: HQLErrorPosition,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'HQLError';
    this.code = code;
    this.position = position;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HQLError);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      ...(this.position && { position: this.position }),
      ...(this.details && { details: this.details }),
    };
  }
}

export function isHQLError(error: unknown): error is HQLError {
  return error instanceof HQLError;
}

// =============================================================================
// Error Factory Functions
// =============================================================================

/**
 * Create a parse error from lexer/parser errors
 */
export function createParseError(
  message: string,
  line: number,
  column: number,
  offset: number
): HQLError {
  return new HQLError(
    'PARSE_ERROR',
    `Parse error at line ${line}, column ${column}: ${message}`,
    { line, column, offset }
  );
}

/**
 * Create a validation error for unknown types
 */
export function createUnknownTypeError(typeName: string): HQLError {
  return new HQLError(
    'UNKNOWN_TYPE',
    `Unknown content type: "${typeName}"`,
    undefined,
    { type: typeName }
  );
}

/**
 * Create a validation error for unknown fields
 */
export function createUnknownFieldError(fieldName: string, typeName: string): HQLError {
  return new HQLError(
    'UNKNOWN_FIELD',
    `Field "${fieldName}" does not exist on type "${typeName}"`,
    undefined,
    { field: fieldName, type: typeName }
  );
}

/**
 * Create a cost exceeded error
 */
export function createCostExceededError(cost: number, maxCost: number): HQLError {
  return new HQLError(
    'COST_EXCEEDED',
    `Query cost (${cost}) exceeds maximum allowed (${maxCost})`,
    undefined,
    { cost, maxCost }
  );
}

/**
 * Create a depth exceeded error
 */
export function createDepthExceededError(depth: number, maxDepth: number): HQLError {
  return new HQLError(
    'DEPTH_EXCEEDED',
    `Reference depth (${depth}) exceeds maximum allowed (${maxDepth})`,
    undefined,
    { depth, maxDepth }
  );
}

/**
 * Create a timeout error
 */
export function createTimeoutError(timeout: number): HQLError {
  return new HQLError(
    'TIMEOUT',
    `Query execution timed out after ${timeout}ms`,
    undefined,
    { timeout }
  );
}

/**
 * Create an invalid parameter error
 */
export function createInvalidParamError(paramName: string, reason: string): HQLError {
  return new HQLError(
    'INVALID_PARAM',
    `Invalid parameter "${paramName}": ${reason}`,
    undefined,
    { param: paramName, reason }
  );
}

/**
 * Create an execution error
 */
export function createExecutionError(message: string, cause?: unknown): HQLError {
  return new HQLError(
    'EXECUTION_ERROR',
    message,
    undefined,
    cause ? { cause: String(cause) } : undefined
  );
}

/**
 * Format error response for API
 */
export function formatHQLErrorResponse(error: HQLError): {
  error: {
    code: HQLErrorCode;
    message: string;
    position?: HQLErrorPosition;
    details?: Record<string, unknown>;
  };
} {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(error.position && { position: error.position }),
      ...(error.details && { details: error.details }),
    },
  };
}
