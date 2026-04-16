import { prisma } from '../config/database.js';
import type { Prisma } from '../generated/prisma/client.js';

// Activity data types - compatible with Prisma JSON input
export type ActivityData = {
  [key: string]: string | number | boolean | null | ActivityData | ActivityData[];
};

export type ActivityAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'RESTORE'
  | 'ADD_MEMBER'
  | 'REMOVE_MEMBER'
  | 'UPDATE_ROLE'
  | 'ADD_SUBTASK'
  | 'UPDATE_SUBTASK'
  | 'DELETE_SUBTASK'
  | 'ADD_ASSIGNEE'
  | 'REMOVE_ASSIGNEE'
  | 'ADD_COMMENT'
  | 'UPDATE_COMMENT'
  | 'DELETE_COMMENT';

export type EntityType = 'Project' | 'Task' | 'Subtask' | 'Comment';

interface LogParams {
  action: ActivityAction;
  entityType: EntityType;
  entityId: string;
  userId: string;
  oldData?: ActivityData;
  newData?: ActivityData;
  metadata?: ActivityData;
}

export const log = async ({
  action,
  entityType,
  entityId,
  userId,
  oldData,
  newData,
  metadata,
}: LogParams) => {
  return prisma.activityLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      oldData: oldData ?? undefined,
      newData: newData ?? undefined,
      metadata: metadata ?? undefined,
    },
  });
};

export const findByProject = async (
  projectId: string,
  page: number,
  limit: number,
  filters?: {
    entityType?: string;
    action?: string;
  }
) => {
  const skip = (page - 1) * limit;

  const baseFilter = filters?.entityType ? { entityType: filters.entityType } : {};

  const actionFilter = filters?.action
    ? { action: { contains: filters.action, mode: 'insensitive' as const } }
    : {};

  const where: Prisma.ActivityLogWhereInput = {
    OR: [
      { entityType: 'Project', entityId: projectId },
      { entityType: 'Task', metadata: { path: ['projectId'], equals: projectId } },
      { entityType: 'Subtask', metadata: { path: ['projectId'], equals: projectId } },
      { entityType: 'Comment', metadata: { path: ['projectId'], equals: projectId } },
    ],
    ...baseFilter,
    ...actionFilter,
  };

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const findByEntity = async (
  entityType: EntityType,
  entityId: string,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: { entityType, entityId },
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({
      where: { entityType, entityId },
    }),
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
