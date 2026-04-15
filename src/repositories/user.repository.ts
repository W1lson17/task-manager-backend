import { prisma } from '../config/database.js';
import { hashPassword } from '../helpers/index.js';
import type { SignupInput } from '../schemas/auth.schema.js';

export interface CreateUserData extends SignupInput {
  passwordHash: string;
}

export const createUser = async (data: CreateUserData) => {
  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  return user;
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
};

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};
