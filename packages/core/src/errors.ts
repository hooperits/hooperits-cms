/**
 * HOOPERITS CMS - Error Types
 * Custom error classes for consistent error handling
 */

export class CMSError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CMSError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class ValidationError extends CMSError {
  public readonly errors: Array<{ field: string; message: string }>;

  constructor(errors: Array<{ field: string; message: string }>) {
    super('Validation failed', 'VALIDATION_ERROR', 400, { errors });
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class NotFoundError extends CMSError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends CMSError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends CMSError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends CMSError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class BadRequestError extends CMSError {
  constructor(message: string) {
    super(message, 'BAD_REQUEST', 400);
    this.name = 'BadRequestError';
  }
}

export class StateTransitionError extends CMSError {
  constructor(
    public readonly currentStatus: string,
    public readonly targetStatus: string,
    public readonly allowedTransitions: string[]
  ) {
    const allowed = allowedTransitions.length > 0
      ? allowedTransitions.join(', ')
      : 'none';
    super(
      `Cannot transition from ${currentStatus} to ${targetStatus}. Valid transitions: ${allowed}`,
      'INVALID_STATE_TRANSITION',
      400,
      { currentStatus, targetStatus, allowedTransitions }
    );
    this.name = 'StateTransitionError';
  }
}

export class TooManyRequestsError extends CMSError {
  constructor(
    message: string = 'Too many requests',
    public readonly retryAfterMs?: number
  ) {
    super(message, 'TOO_MANY_REQUESTS', 429, { retryAfterMs });
    this.name = 'TooManyRequestsError';
  }
}

export function isCMSError(error: unknown): error is CMSError {
  return error instanceof CMSError;
}

export function formatErrorResponse(error: unknown) {
  if (isCMSError(error)) {
    return {
      error: error.toJSON(),
      status: error.statusCode,
    };
  }

  // Unknown error
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    },
    status: 500,
  };
}
