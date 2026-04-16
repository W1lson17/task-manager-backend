import { prisma } from '../config/database.js';
import * as commentRepo from '../repositories/comment.repository.js';
import * as projectRepo from '../repositories/project.repository.js';
import * as activityRepo from '../repositories/activity.repository.js';
import { ForbiddenError, NotFoundError } from '../utils/index.js';
import type { CreateCommentInput, UpdateCommentInput } from '../schemas/comment.schema.js';

export const create = async (taskId: string, userId: string, data: CreateCommentInput) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true },
  });

  if (!task) {
    throw new NotFoundError('Task');
  }

  const isMember = await projectRepo.isProjectMember(task.projectId, userId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this project');
  }

  const comment = await commentRepo.createComment(taskId, userId, data);

  // Log activity
  await activityRepo.log({
    action: 'ADD_COMMENT',
    entityType: 'Comment',
    entityId: comment.id,
    userId,
    newData: { content: data.content.substring(0, 100) },
    metadata: { projectId: task.projectId, taskId },
  });

  return comment;
};

export const findAll = async (taskId: string, userId: string, page: number, limit: number) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true },
  });

  if (!task) {
    throw new NotFoundError('Task');
  }

  const isMember = await projectRepo.isProjectMember(task.projectId, userId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this project');
  }

  return commentRepo.findCommentsByTask(taskId, page, limit);
};

export const findOne = async (commentId: string, userId: string) => {
  const comment = await commentRepo.findCommentById(commentId);

  if (!comment) {
    throw new NotFoundError('Comment');
  }

  const isMember = await projectRepo.isProjectMember(comment.task.projectId, userId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this project');
  }

  return comment;
};

export const update = async (commentId: string, userId: string, data: UpdateCommentInput) => {
  const comment = await commentRepo.findCommentById(commentId);

  if (!comment) {
    throw new NotFoundError('Comment');
  }

  if (comment.authorId !== userId) {
    throw new ForbiddenError('You can only edit your own comments');
  }

  // Log old data
  const oldContent = comment.content.substring(0, 100);

  const updatedComment = await commentRepo.updateComment(commentId, data);

  // Log activity
  await activityRepo.log({
    action: 'UPDATE_COMMENT',
    entityType: 'Comment',
    entityId: commentId,
    userId,
    oldData: { content: oldContent },
    newData: { content: data.content.substring(0, 100) },
    metadata: { taskId: comment.taskId },
  });

  return updatedComment;
};

export const remove = async (commentId: string, userId: string) => {
  const comment = await commentRepo.findCommentById(commentId);

  if (!comment) {
    throw new NotFoundError('Comment');
  }

  if (comment.authorId !== userId) {
    throw new ForbiddenError('You can only delete your own comments');
  }

  // Log activity
  await activityRepo.log({
    action: 'DELETE_COMMENT',
    entityType: 'Comment',
    entityId: commentId,
    userId,
    oldData: { content: comment.content.substring(0, 100) },
    metadata: { taskId: comment.taskId },
  });

  return commentRepo.deleteComment(commentId);
};
