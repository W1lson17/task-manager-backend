import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { errorHandler, globalRateLimiter } from './middlewares/index.js';
import { successResponse } from './utils/index.js';
import apiRoutes from './routes/index.js';

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origins,
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  app.use(globalRateLimiter);

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json(successResponse({ status: 'ok', timestamp: new Date().toISOString() }));
  });

  // API routes
  app.use('/api/v1', apiRoutes);

  // 404 handler
  app.use((_req: Request, _res: Response, next) => {
    next(new Error('Route not found'));
  });

  // Error handler
  app.use(errorHandler);

  return app;
};
