import { prisma } from '../config/database.js';

export const addAssignee = async (taskId: string, userId: string) => {
  return prisma.taskAssignee.create({
    data: {
      taskId,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });
};

export const removeAssignee = async (taskId: string, userId: string) => {
  return prisma.taskAssignee.delete({
    where: {
      taskId_userId: {
        taskId,
        userId,
      },
    },
  });
};

export const findAssigneesByTask = async (taskId: string) => {
  return prisma.taskAssignee.findMany({
    where: { taskId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });
};

export const isUserAssigned = async (taskId: string, userId: string) => {
  const assignee = await prisma.taskAssignee.findUnique({
    where: {
      taskId_userId: {
        taskId,
        userId,
      },
    },
  });
  return !!assignee;
};
