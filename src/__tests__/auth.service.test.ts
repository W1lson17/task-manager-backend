import { describe, it, expect, vi, beforeEach } from 'vitest';
import { helpersMock } from './setup';
import { comparePassword, signAccessToken, signRefreshToken } from '../helpers/index';

// Import after mocks are set up
import * as authService from '../services/auth.service';
import * as authRepo from '../repositories/user.repository';
import * as sessionRepo from '../repositories/session.repository';

// Mock repositories
vi.mock('../repositories/user.repository', () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  default: {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    createUser: vi.fn(),
  },
}));

vi.mock('../repositories/session.repository', () => ({
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  deleteAllUserSessions: vi.fn(),
  updateSessionRefreshToken: vi.fn(),
  findSessionByRefreshToken: vi.fn(),
  default: {
    createSession: vi.fn(),
    deleteSession: vi.fn(),
    deleteAllUserSessions: vi.fn(),
    updateSessionRefreshToken: vi.fn(),
    findSessionByRefreshToken: vi.fn(),
  },
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      authRepo.findUserByEmail.mockResolvedValue(null);
      authRepo.createUser.mockResolvedValue(mockUser);

      const result = await authService.signup({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      });

      expect(result).toEqual(mockUser);
      expect(authRepo.createUser).toHaveBeenCalled();
    });

    it('should throw ConflictError if user already exists', async () => {
      authRepo.findUserByEmail.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      });

      await expect(
        authService.signup({
          email: 'test@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      authRepo.findUserByEmail.mockResolvedValue(mockUser);
      helpersMock.comparePassword.mockResolvedValue(true);
      sessionRepo.createSession.mockResolvedValue(mockSession);
      helpersMock.signAccessToken.mockReturnValue('access-token');
      helpersMock.signRefreshToken.mockReturnValue('refresh-token');
      sessionRepo.updateSessionRefreshToken.mockResolvedValue(undefined);

      const result = await authService.login(
        { email: 'test@example.com', password: 'Password123' },
        'Mozilla/5.0',
        '127.0.0.1'
      );

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('should throw AuthenticationError for invalid email', async () => {
      authRepo.findUserByEmail.mockResolvedValue(null);

      await expect(
        authService.login(
          { email: 'nonexistent@example.com', password: 'Password123' },
          'Mozilla/5.0',
          '127.0.0.1'
        )
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw AuthenticationError for invalid password', async () => {
      authRepo.findUserByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword',
      });
      helpersMock.comparePassword.mockResolvedValue(false);

      await expect(
        authService.login(
          { email: 'test@example.com', password: 'WrongPassword' },
          'Mozilla/5.0',
          '127.0.0.1'
        )
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should delete the session', async () => {
      sessionRepo.deleteSession.mockResolvedValue(undefined);

      await authService.logout('session-123');

      expect(sessionRepo.deleteSession).toHaveBeenCalledWith('session-123');
    });
  });

  describe('logoutAll', () => {
    it('should delete all user sessions', async () => {
      sessionRepo.deleteAllUserSessions.mockResolvedValue({ count: 5 });

      await authService.logoutAll('user-123');

      expect(sessionRepo.deleteAllUserSessions).toHaveBeenCalledWith('user-123');
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens for valid refresh token', async () => {
      const mockDecoded = { userId: 'user-123', sessionId: 'session-123' };
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      helpersMock.verifyToken.mockReturnValue(mockDecoded);
      sessionRepo.findSessionByRefreshToken.mockResolvedValue(mockSession);
      helpersMock.signAccessToken.mockReturnValue('new-access-token');
      helpersMock.signRefreshToken.mockReturnValue('new-refresh-token');
      sessionRepo.updateSessionRefreshToken.mockResolvedValue(undefined);

      const result = await authService.refreshTokens('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw AuthenticationError for expired session', async () => {
      helpersMock.verifyToken.mockReturnValue({ userId: 'user-123', sessionId: 'session-123' });
      sessionRepo.findSessionByRefreshToken.mockResolvedValue(null);

      await expect(authService.refreshTokens('expired-token')).rejects.toThrow(
        'Invalid refresh token'
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      authRepo.findUserById.mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser('user-123');

      // getCurrentUser returns all user fields
      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
      expect(result.avatarUrl).toBe(null);
    });

    it('should throw AuthenticationError for non-existent user', async () => {
      authRepo.findUserById.mockResolvedValue(null);

      await expect(authService.getCurrentUser('non-existent')).rejects.toThrow('User not found');
    });
  });
});
