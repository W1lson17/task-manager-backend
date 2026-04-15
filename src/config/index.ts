import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['PORT'] ?? '3000', 10),

  jwt: {
    secret: process.env['JWT_SECRET'] ?? 'dev-secret',
    expiresIn: process.env['JWT_EXPIRES_IN'] ?? '1h',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d',
  },

  cors: {
    origins: (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:3000').split(','),
  },

  database: {
    url: process.env['DATABASE_URL'] ?? '',
  },

  redis: {
    url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
  },
} as const;

export type Config = typeof config;

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Warning: ${envVar} is not set`);
  }
}
