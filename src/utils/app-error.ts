import { ERROR_CODES, type ErrorCode } from '../config/errors.js';

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(code: ErrorCode, message: string, details?: unknown, statusCode?: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode ?? 500;
    this.details = details;
    this.isOperational = true;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ERROR_CODES.VALIDATION_ERROR, message, details, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, code: ErrorCode = ERROR_CODES.AUTH_REQUIRED) {
    super(code, message, undefined, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(ERROR_CODES.AUTH_FORBIDDEN, message, undefined, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(ERROR_CODES.RESOURCE_NOT_FOUND, `${resource} not found`, undefined, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ERROR_CODES.RESOURCE_CONFLICT, message, undefined, 409);
  }
}

export class GoneError extends AppError {
  constructor(resource: string = 'Resource') {
    super(ERROR_CODES.RESOURCE_GONE, `${resource} has been deleted`, undefined, 410);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super(
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      'Too many requests, please try again later',
      undefined,
      429
    );
  }
}
