import { randomUUID } from 'crypto';
import { prisma } from '../config/database.js';

export interface CreateSessionData {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
}

export const createSession = async (data: CreateSessionData) => {
  return prisma.session.create({
    data: {
      id: randomUUID(),
      userId: data.userId,
      refreshToken: randomUUID(), // Will be updated after signing
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      expiresAt: data.expiresAt,
    },
  });
};

export const updateSessionRefreshToken = async (sessionId: string, refreshToken: string) => {
  return prisma.session.update({
    where: { id: sessionId },
    data: { refreshToken },
  });
};

export const findSessionByRefreshToken = async (refreshToken: string) => {
  return prisma.session.findUnique({
    where: { refreshToken },
  });
};

export const findSessionById = async (sessionId: string) => {
  return prisma.session.findUnique({
    where: { id: sessionId },
  });
};

export const deleteSession = async (sessionId: string) => {
  return prisma.session.delete({
    where: { id: sessionId },
  });
};

export const deleteAllUserSessions = async (userId: string) => {
  return prisma.session.deleteMany({
    where: { userId },
  });
};

export const deleteExpiredSessions = async () => {
  return prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
};
