import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/index.js';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const zodError = result.error as ZodError;
      const details = zodError.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

      throw new ValidationError('Validation failed', details);
    }

    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const zodError = result.error as ZodError;
      const details = zodError.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

      throw new ValidationError('Invalid query parameters', details);
    }

    req.query = result.data;
    next();
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const zodError = result.error as ZodError;
      const details = zodError.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

      throw new ValidationError('Invalid path parameters', details);
    }

    req.params = result.data;
    next();
  };
};
