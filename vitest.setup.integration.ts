/**
 * Vitest Setup para Tests de Integración
 *
 * Este archivo configura los mocks necesarios para los tests de integración.
 * El Prisma client se usa REAL en los tests de integración gracias a
 * vitest-environment-prisma-postgres que envuelve cada test en una transacción.
 *
 * Aquí mockeamos solo las dependencias externas como JWT, bcrypt, etc.
 */

import { vi } from 'vitest';

// Mock de JWT
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-jwt-token'),
    verify: vi.fn(() => ({ userId: 'test-user-id', email: 'test@example.com' })),
  },
}));

// Mock de bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(async (password: string) => `hashed_${password}`),
    compare: vi.fn(async (password: string, hash: string) => {
      return hash === `hashed_${password}`;
    }),
  },
}));

// Mock de uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-v4'),
  v7: vi.fn(() => 'test-uuid-v7'),
}));
