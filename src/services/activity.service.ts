import * as activityRepo from '../repositories/activity.repository.js';
import * as projectRepo from '../repositories/project.repository.js';
import type {
  ActivityAction,
  ActivityData,
  EntityType,
} from '../repositories/activity.repository.js';
import { ForbiddenError } from '../utils/index.js';

export const log = async (
  action: ActivityAction,
  entityType: EntityType,
  entityId: string,
  userId: string,
  oldData?: ActivityData,
  newData?: ActivityData,
  metadata?: ActivityData
) => {
  return activityRepo.log({
    action,
    entityType,
    entityId,
    userId,
    oldData,
    newData,
    metadata,
  });
};

export const findByProject = async (
  projectId: string,
  userId: string,
  page: number,
  limit: number,
  filters?: { entityType?: string; action?: string }
) => {
  const isMember = await projectRepo.isProjectMember(projectId, userId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this project');
  }

  return activityRepo.findByProject(projectId, page, limit, filters);
};

export const findByEntity = async (
  projectId: string,
  entityType: EntityType,
  entityId: string,
  userId: string,
  page: number,
  limit: number
) => {
  const isMember = await projectRepo.isProjectMember(projectId, userId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this project');
  }

  return activityRepo.findByEntity(entityType, entityId, page, limit);
};
