import { prisma } from '../config/database.js';

export const createSubtask = async (
  taskId: string,
  data: {
    title: string;
    isDone?: boolean;
    position?: number;
  }
) => {
  return prisma.subtask.create({
    data: {
      taskId,
      title: data.title,
      isDone: data.isDone ?? false,
      position: data.position ?? 0,
    },
  });
};

export const findSubtaskById = async (subtaskId: string) => {
  return prisma.subtask.findUnique({
    where: { id: subtaskId },
  });
};

export const findSubtasksByTask = async (taskId: string) => {
  return prisma.subtask.findMany({
    where: { taskId },
    orderBy: { position: 'asc' },
  });
};

export const updateSubtask = async (
  subtaskId: string,
  data: {
    title?: string;
    isDone?: boolean;
    position?: number;
  }
) => {
  return prisma.subtask.update({
    where: { id: subtaskId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.isDone !== undefined && { isDone: data.isDone }),
      ...(data.position !== undefined && { position: data.position }),
    },
  });
};

export const deleteSubtask = async (subtaskId: string) => {
  return prisma.subtask.delete({
    where: { id: subtaskId },
  });
};

export const isSubtaskInTask = async (subtaskId: string, taskId: string) => {
  const subtask = await prisma.subtask.findFirst({
    where: { id: subtaskId, taskId },
  });
  return !!subtask;
};
