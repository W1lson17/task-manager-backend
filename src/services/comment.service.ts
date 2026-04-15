import { prisma } from '../config/database.js';
import * as commentRepo from '../repositories/comment.repository.js';
import * as projectRepo from '../repositories/project.repository.js';
import { ForbiddenError, NotFoundError } from '../utils/index.js';
import type { CreateCommentInput, UpdateCommentInput } from '../schemas/comment.schema.js';

export const create = async (taskId: string, userId: string, data: CreateCommentInput) => {
  // Find the task to get the projectId
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

  return commentRepo.createComment(taskId, userId, data);
};

export const findAll = async (taskId: string, userId: string, page: number, limit: number) => {
  // Find the task to get the projectId
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

  // Only author can edit their comment
  if (comment.authorId !== userId) {
    throw new ForbiddenError('You can only edit your own comments');
  }

  return commentRepo.updateComment(commentId, data);
};

export const remove = async (commentId: string, userId: string) => {
  const comment = await commentRepo.findCommentById(commentId);

  if (!comment) {
    throw new NotFoundError('Comment');
  }

  // Only author can delete their comment
  if (comment.authorId !== userId) {
    throw new ForbiddenError('You can only delete your own comments');
  }

  return commentRepo.deleteComment(commentId);
};
