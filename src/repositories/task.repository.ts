import { prisma } from '../config/database.js';
import type { TaskStatusInput, PriorityInput } from '../schemas/task.schema.js';

export const createTask = async (
  projectId: string,
  createdById: string,
  data: {
    title: string;
    description?: string;
    status?: TaskStatusInput;
    priority?: PriorityInput;
    dueDate?: Date;
    startDate?: Date;
    position?: number;
    isRecurring?: boolean;
    recurrence?: object;
  }
) => {
  return prisma.task.create({
    data: {
      projectId,
      createdById,
      title: data.title,
      description: data.description,
      status: data.status || 'TODO',
      priority: data.priority || 'MEDIUM',
      dueDate: data.dueDate,
      startDate: data.startDate,
      position: data.position ?? 0,
      isRecurring: data.isRecurring ?? false,
      recurrence: data.recurrence,
    },
  });
};

export const findTaskById = async (taskId: string) => {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      subtasks: {
        orderBy: { position: 'asc' },
      },
      assignees: {
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
      },
      labels: {
        include: {
          label: true,
        },
      },
    },
  });
};

export const findTasksByProject = async (
  projectId: string,
  page: number,
  limit: number,
  filters?: {
    status?: string;
    priority?: string;
    search?: string;
    assignedTo?: string;
  }
) => {
  const skip = (page - 1) * limit;

  const where: object = {
    projectId,
    deletedAt: null,
    ...(filters?.status && { status: filters.status }),
    ...(filters?.priority && { priority: filters.priority }),
    ...(filters?.search && {
      OR: [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
    ...(filters?.assignedTo && {
      assignees: {
        some: {
          userId: filters.assignedTo,
        },
      },
    }),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        assignees: {
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
        },
        labels: {
          include: {
            label: true,
          },
        },
        _count: {
          select: {
            subtasks: true,
            comments: true,
          },
        },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateTask = async (
  taskId: string,
  data: {
    title?: string;
    description?: string | null;
    status?: TaskStatusInput;
    priority?: PriorityInput;
    dueDate?: Date | null;
    startDate?: Date | null;
    completedAt?: Date | null;
    position?: number;
    isRecurring?: boolean;
    recurrence?: object | null;
  }
) => {
  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
  if (data.position !== undefined) updateData.position = data.position;
  if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
  if (data.recurrence !== undefined) {
    updateData.recurrence = data.recurrence ?? null;
  }

  return prisma.task.update({
    where: { id: taskId },
    data: updateData,
  });
};

export const deleteTask = async (taskId: string) => {
  return prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: new Date() },
  });
};

export const restoreTask = async (taskId: string) => {
  return prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: null },
  });
};

export const isTaskInProject = async (taskId: string, projectId: string) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
  });
  return !!task;
};

export const canUserModifyTask = async (taskId: string, userId: string) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!task) return false;

  const member = task.project.members[0];
  if (!member) return false;

  return ['OWNER', 'ADMIN', 'MEMBER'].includes(member.role);
};
