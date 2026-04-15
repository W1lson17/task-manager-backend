import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../helpers/index.js';
import { AuthenticationError } from '../utils/index.js';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('No token provided', 'AUTH_REQUIRED');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new AuthenticationError('Invalid authorization format', 'AUTH_TOKEN_INVALID');
    }

    const payload = verifyToken(token);

    req.userId = payload.userId;
    req.sessionId = payload.sessionId;

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
      return;
    }

    next(new AuthenticationError('Invalid or expired token', 'AUTH_TOKEN_INVALID'));
  }
};
