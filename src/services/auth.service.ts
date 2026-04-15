import {
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '../helpers/index.js';
import { createUser, findUserByEmail, findUserById } from '../repositories/index.js';
import {
  createSession,
  deleteSession,
  deleteAllUserSessions,
  updateSessionRefreshToken,
  findSessionByRefreshToken,
} from '../repositories/index.js';
import { ConflictError, AuthenticationError } from '../utils/index.js';
import type { SignupInput, LoginInput } from '../schemas/auth.schema.js';
import type { Tokens } from '../helpers/index.js';

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const getRefreshTokenExpiry = () => {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  return date;
};

export const signup = async (data: SignupInput) => {
  // Check if user already exists
  const existingUser = await findUserByEmail(data.email);
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Create user
  const user = await createUser({
    email: data.email,
    password: data.password,
    name: data.name,
    passwordHash: data.password, // Will be hashed in repository
  });

  return user;
};

export const login = async (
  data: LoginInput,
  userAgent?: string,
  ipAddress?: string
): Promise<Tokens> => {
  // Find user
  const user = await findUserByEmail(data.email);
  if (!user) {
    throw new AuthenticationError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS');
  }

  // Verify password
  const isValidPassword = await comparePassword(data.password, user.password);
  if (!isValidPassword) {
    throw new AuthenticationError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS');
  }

  // Create session
  const session = await createSession({
    userId: user.id,
    userAgent,
    ipAddress,
    expiresAt: getRefreshTokenExpiry(),
  });

  // Generate tokens
  const payload = { userId: user.id, sessionId: session.id };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Save refresh token in session
  await updateSessionRefreshToken(session.id, refreshToken);

  return { accessToken, refreshToken };
};

export const refreshTokens = async (refreshToken: string) => {
  // Verify token
  const decoded = verifyToken(refreshToken);

  // Check if session exists and is valid
  const session = await findSessionByRefreshToken(refreshToken);
  if (!session) {
    throw new AuthenticationError('Invalid refresh token', 'AUTH_REFRESH_TOKEN_INVALID');
  }

  // Check if session is expired
  if (new Date() > session.expiresAt) {
    await deleteSession(session.id);
    throw new AuthenticationError('Refresh token expired', 'AUTH_REFRESH_TOKEN_EXPIRED');
  }

  // Generate new tokens
  const payload = { userId: decoded.userId, sessionId: session.id };
  const newAccessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  // Update session with new refresh token
  await updateSessionRefreshToken(session.id, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logout = async (sessionId: string) => {
  await deleteSession(sessionId);
};

export const logoutAll = async (userId: string) => {
  await deleteAllUserSessions(userId);
};

export const getCurrentUser = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AuthenticationError('User not found', 'AUTH_REQUIRED');
  }
  return user;
};
