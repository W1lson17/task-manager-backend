import * as labelRepo from '../repositories/label.repository.js';
import * as projectRepo from '../repositories/project.repository.js';
import * as taskRepo from '../repositories/task.repository.js';
import { ForbiddenError, NotFoundError, ConflictError } from '../utils/index.js';
import type { CreateLabelInput, UpdateLabelInput } from '../schemas/label.schema.js';

// Labels CRUD
export const create = async (projectId: string, userId: string, data: CreateLabelInput) => {
  const role = await projectRepo.getMemberRole(projectId, userId);
  if (!role) {
    throw new ForbiddenError('You are not a member of this project');
  }

  if (role === 'VIEWER') {
    throw new ForbiddenError('Viewers cannot create labels');
  }

  return labelRepo.createLabel(projectId, data);
};

export const findAll = async (projectId: string, userId: string) => {
  const isMember = await projectRepo.isProjectMember(projectId, userId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this project');
  }

  return labelRepo.findLabelsByProject(projectId);
};

export const findOne = async (labelId: string, userId: string) => {
  const label = await labelRepo.findLabelById(labelId);

  if (!label) {
    throw new NotFoundError('Label');
  }

  const isMember = await projectRepo.isProjectMember(label.projectId, userId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this project');
  }

  return label;
};

export const update = async (labelId: string, userId: string, data: UpdateLabelInput) => {
  const label = await labelRepo.findLabelById(labelId);

  if (!label) {
    throw new NotFoundError('Label');
  }

  const role = await projectRepo.getMemberRole(label.projectId, userId);
  if (!role || role === 'VIEWER') {
    throw new ForbiddenError('Only members can update labels');
  }

  return labelRepo.updateLabel(labelId, data);
};

export const remove = async (labelId: string, userId: string) => {
  const label = await labelRepo.findLabelById(labelId);

  if (!label) {
    throw new NotFoundError('Label');
  }

  const role = await projectRepo.getMemberRole(label.projectId, userId);
  if (!role || role === 'VIEWER') {
    throw new ForbiddenError('Only members can delete labels');
  }

  return labelRepo.deleteLabel(labelId);
};

// Task Labels
export const addLabelToTask = async (
  projectId: string,
  taskId: string,
  labelId: string,
  userId: string
) => {
  const role = await projectRepo.getMemberRole(projectId, userId);
  if (!role) {
    throw new ForbiddenError('You are not a member of this project');
  }

  if (role === 'VIEWER') {
    throw new ForbiddenError('Viewers cannot assign labels');
  }

  const task = await taskRepo.findTaskById(taskId);
  if (!task || task.projectId !== projectId) {
    throw new NotFoundError('Task');
  }

  const label = await labelRepo.findLabelById(labelId);
  if (!label || label.projectId !== projectId) {
    throw new NotFoundError('Label');
  }

  const isAssigned = await labelRepo.isLabelAssignedToTask(taskId, labelId);
  if (isAssigned) {
    throw new ConflictError('Label is already assigned to this task');
  }

  return labelRepo.addLabelToTask(taskId, labelId);
};

export const removeLabelFromTask = async (
  projectId: string,
  taskId: string,
  labelId: string,
  userId: string
) => {
  const role = await projectRepo.getMemberRole(projectId, userId);
  if (!role) {
    throw new ForbiddenError('You are not a member of this project');
  }

  if (role === 'VIEWER') {
    throw new ForbiddenError('Viewers cannot remove labels');
  }

  const task = await taskRepo.findTaskById(taskId);
  if (!task || task.projectId !== projectId) {
    throw new NotFoundError('Task');
  }

  return labelRepo.removeLabelFromTask(taskId, labelId);
};

export const findTaskLabels = async (projectId: string, taskId: string, userId: string) => {
  const isMember = await projectRepo.isProjectMember(projectId, userId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this project');
  }

  const task = await taskRepo.findTaskById(taskId);
  if (!task || task.projectId !== projectId) {
    throw new NotFoundError('Task');
  }

  return labelRepo.findLabelsByTask(taskId);
};
