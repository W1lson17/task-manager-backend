import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'prisma-postgres',
    setupFiles: ['./vitest.setup.integration.ts'],
    include: ['src/__tests__/integration/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Limitaciones de vitest-environment-prisma-postgres:
    // - No funciona con pool vmThreads o vmForks
    // - maxConcurrency debe ser 1
    pool: 'forks',
    maxConcurrency: 1,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
