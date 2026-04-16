import { prisma } from '../config/database.js';

export const createLabel = async (projectId: string, data: { name: string; color?: string }) => {
  return prisma.label.create({
    data: {
      projectId,
      name: data.name,
      color: data.color || '#3B82F6',
    },
  });
};

export const findLabelById = async (labelId: string) => {
  return prisma.label.findUnique({
    where: { id: labelId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

export const findLabelsByProject = async (projectId: string) => {
  return prisma.label.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });
};

export const updateLabel = async (labelId: string, data: { name?: string; color?: string }) => {
  return prisma.label.update({
    where: { id: labelId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.color !== undefined && { color: data.color }),
    },
  });
};

export const deleteLabel = async (labelId: string) => {
  return prisma.label.delete({
    where: { id: labelId },
  });
};

export const isLabelInProject = async (labelId: string, projectId: string) => {
  const label = await prisma.label.findFirst({
    where: { id: labelId, projectId },
  });
  return !!label;
};

// Task Labels (many-to-many relationship)
export const addLabelToTask = async (taskId: string, labelId: string) => {
  return prisma.taskLabel.create({
    data: {
      taskId,
      labelId,
    },
    include: {
      label: true,
    },
  });
};

export const removeLabelFromTask = async (taskId: string, labelId: string) => {
  return prisma.taskLabel.delete({
    where: {
      taskId_labelId: {
        taskId,
        labelId,
      },
    },
  });
};

export const findLabelsByTask = async (taskId: string) => {
  return prisma.taskLabel.findMany({
    where: { taskId },
    include: {
      label: true,
    },
  });
};

export const isLabelAssignedToTask = async (taskId: string, labelId: string) => {
  const taskLabel = await prisma.taskLabel.findUnique({
    where: {
      taskId_labelId: {
        taskId,
        labelId,
      },
    },
  });
  return !!taskLabel;
};
