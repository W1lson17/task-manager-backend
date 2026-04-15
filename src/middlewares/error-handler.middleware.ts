import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/index.js';
import { ERROR_CODES, DATABASE_ERROR_CODES, isProduction } from '../config/errors.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  if (!isProduction) {
    console.error('Error:', err);
  }

  // Handle AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  // Handle Prisma errors
  if ('code' in err) {
    const code = err.code as string;

    // Unique constraint violation
    if (code === DATABASE_ERROR_CODES.UNIQUE_VIOLATION) {
      res.status(409).json({
        error: {
          code: ERROR_CODES.RESOURCE_CONFLICT,
          message: 'A resource with this value already exists',
        },
      });
      return;
    }

    // Foreign key violation
    if (code === DATABASE_ERROR_CODES.FOREIGN_KEY_VIOLATION) {
      res.status(400).json({
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Referenced resource does not exist',
        },
      });
      return;
    }
  }

  // Unknown error
  res.status(500).json({
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: isProduction ? 'Internal server error' : err.message,
    },
  });
};
