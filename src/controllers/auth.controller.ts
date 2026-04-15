import type { Request, Response } from 'express';
import {
  signup,
  login,
  logout,
  logoutAll,
  getCurrentUser,
  refreshTokens,
} from '../services/index.js';
import { successResponse } from '../utils/index.js';
import type { SignupInput, LoginInput } from '../schemas/auth.schema.js';

export const register = async (req: Request, res: Response) => {
  const data = req.body as SignupInput;
  const user = await signup(data);

  res.status(201).json(successResponse(user));
};

export const loginUser = async (req: Request, res: Response) => {
  const data = req.body as LoginInput;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip || req.socket.remoteAddress;

  const tokens = await login(data, userAgent, ipAddress);

  res.json(successResponse(tokens));
};

export const refreshAccessTokens = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const tokens = await refreshTokens(refreshToken);

  res.json(successResponse(tokens));
};

export const logoutUser = async (req: Request, res: Response) => {
  const sessionId = req.sessionId;

  if (sessionId) {
    await logout(sessionId);
  }

  res.json(successResponse({ message: 'Logged out successfully' }));
};

export const logoutAllSessions = async (req: Request, res: Response) => {
  const userId = req.userId!;

  await logoutAll(userId);

  res.json(successResponse({ message: 'Logged out from all devices' }));
};

export const me = async (req: Request, res: Response) => {
  const userId = req.userId!;

  const user = await getCurrentUser(userId);

  res.json(successResponse(user));
};
