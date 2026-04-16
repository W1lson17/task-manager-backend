import * as taskRepo from '../repositories/task.repository.js';
import * as subtaskRepo from '../repositories/subtask.repository.js';
import * as assigneeRepo from '../repositories/assignee.repository.js';
import * as projectRepo from '../repositories/project.repository.js';
import * as activityRepo from '../repositories/activity.repository.js';
import { ForbiddenError, NotFoundError } from '../utils/index.js';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  CreateSubtaskInput,
  UpdateSubtaskInput,
} from '../schemas/task.schema.js';

export const create = async (projectId: string, userId: string, data: CreateTaskInput) => {
  const role = await projectRepo.getMemberRole(projectId, userId);
  if (!role) {
    throw new ForbiddenError('You are not a member of this project');
  }

  if (role === 'VIEWER') {
    throw new ForbiddenError('Viewers cannot create tasks');
  }

  const task = await taskRepo.createTask(projectId, userId, {
    ...data,
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    startDate: data.startDate ? new Date(data.startDate) : undefined,
  });

  // Log activity
  await activityRepo.log({
    action: 'CREATE',
    entityType: 'Task',
    entityId: task.id,
    userId,
    newData: { title: task.title, projectId },
    metadata: { projectId },
  });

  return task;
};

export const findAll = async (
  projectId: string,
  userId: string,
  page: number,
  limit: number,
  filters?: { status?: string; priority?: string; search?: string; assignedTo?: string }
) => {
  const isMember = await projectRepo.isProjectMember(projectId, userId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this project');
  }

  return taskRepo.findTasksByProject(projectId, page, limit, filters);
};

export const findOne = async (projectId: string, taskId: string, userId: string) => {
  const isMember = await projectRepo.isProjectMember(projectId, userId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this project');
  }

  const task = await taskRepo.findTaskById(taskId);
  if (!task) {
    throw new NotFoundError('Task');
  }

  if (task.projectId !== projectId) {
    throw new NotFoundError('Task');
  }

  return task;
};

export const update = async (
  projectId: string,
  taskId: string,
  userId: string,
  data: UpdateTaskInput
) => {
  const canModify = await taskRepo.canUserModifyTask(taskId, userId);
  if (!canModify) {
    throw new ForbiddenError('You do not have permission to modify this task');
  }

  const task = await taskRepo.findTaskById(taskId);
  if (!task || task.projectId !== projectId) {
    throw new NotFoundError('Task');
  }

  // Log old data
  const oldData = { title: task.title, status: task.status, priority: task.priority };

  const updatedTask = await taskRepo.updateTask(taskId, {
    ...data,
    dueDate:
      data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
    startDate:
      data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
    completedAt:
      data.completedAt !== undefined
        ? data.completedAt
          ? new Date(data.completedAt)
          : null
        : undefined,
  });

  // Log activity
  await activityRepo.log({
    action: 'UPDATE',
    entityType: 'Task',
    entityId: taskId,
    userId,
    oldData,
    newData: {
      title: updatedTask.title,
      status: updatedTask.status,
      priority: updatedTask.priority,
    },
    metadata: { projectId },
  });

  return updatedTask;
};

export const remove = async (projectId: string, taskId: string, userId: string) => {
  const canModify = await taskRepo.canUserModifyTask(taskId, userId);
  if (!canModify) {
    throw new ForbiddenError('You do not have permission to delete this task');
  }

  const task = await taskRepo.findTaskById(taskId);
  if (!task || task.projectId !== projectId) {
    throw new NotFoundError('Task');
  }

  // Log activity
  await activityRepo.log({
    action: 'DELETE',
    entityType: 'Task',
    entityId: taskId,
    userId,
    oldData: { title: task.title },
    metadata: { projectId },
  });

  return taskRepo.deleteTask(taskId);
};

export const restore = async (projectId: string, taskId: string, userId: string) => {
  const canModify = await taskRepo.canUserModifyTask(taskId, userId);
  if (!canModify) {
    throw new ForbiddenError('You do not have permission to restore this task');
  }

  const task = await taskRepo.findTaskById(taskId);
  if (!task || task.projectId !== projectId) {
    throw new NotFoundError('Task');
  }

  const restoredTask = await taskRepo.restoreTask(taskId);

  // Log activity
  await activityRepo.log({
    action: 'RESTORE',
    entityType: 'Task',
    entityId: taskId,
    userId,
    newData: { title: restoredTask.title },
    metadata: { projectId },
  });

  return restoredTask;
};

// Subtasks
export const createSubtask = async (
  projectId: string,
  taskId: string,
  userId: string,
  data: CreateSubtaskInput
) => {
  const canModify = await taskRepo.canUserModifyTask(taskId, userId);
  if (!canModify) {
    throw new ForbiddenError('You do not have permission to add subtasks');
  }

  const task = await taskRepo.findTaskById(taskId);
  if (!task || task.projectId !== projectId) {
    throw new NotFoundError('Task');
  }

  const subtask = await subtaskRepo.createSubtask(taskId, data);

  // Log activity
  await activityRepo.log({
    action: 'ADD_SUBTASK',
    entityType: 'Subtask',
    entityId: subtask.id,
    userId,
    newData: { title: subtask.title, taskId },
    metadata: { projectId, parentTaskId: taskId },
  });

  return subtask;
};

export const findSubtasks = async (projectId: string, taskId: string, userId: string) => {
  const isMember = await projectRepo.isProjectMember(projectId, userId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this project');
  }

  const task = await taskRepo.findTaskById(taskId);
  if (!task || task.projectId !== projectId) {
    throw new NotFoundError('Task');
  }

  return subtaskRepo.findSubtasksByTask(taskId);
};

export const updateSubtask = async (
  _projectId: string,
  taskId: string,
  subtaskId: string,
  userId: string,
  data: UpdateSubtaskInput
) => {
  const canModify = await taskRepo.canUserModifyTask(taskId, userId);
  if (!canModify) {
    throw new ForbiddenError('You do not have permission to update subtasks');
  }

  const subtask = await subtaskRepo.findSubtaskById(subtaskId);
  if (!subtask) {
    throw new NotFoundError('Subtask');
  }

  const isValidSubtask = await subtaskRepo.isSubtaskInTask(subtaskId, taskId);
  if (!isValidSubtask) {
    throw new NotFoundError('Subtask');
  }

  // Log old data
  const oldData = { title: subtask.title, isDone: subtask.isDone };

  const updatedSubtask = await subtaskRepo.updateSubtask(subtaskId, data);

  // Log activity
  await activityRepo.log({
    action: 'UPDATE_SUBTASK',
    entityType: 'Subtask',
    entityId: subtaskId,
    userId,
    oldData,
    newData: { title: updatedSubtask.title, isDone: updatedSubtask.isDone },
    metadata: { parentTaskId: taskId },
  });

  return updatedSubtask;
};

export const deleteSubtask = async (
  _projectId: string,
  taskId: string,
  subtaskId: string,
  userId: string
) => {
  const canModify = await taskRepo.canUserModifyTask(taskId, userId);
  if (!canModify) {
    throw new ForbiddenError('You do not have permission to delete subtasks');
  }

  const subtask = await subtaskRepo.findSubtaskById(subtaskId);
  if (!subtask) {
    throw new NotFoundError('Subtask');
  }

  const isValidSubtask = await subtaskRepo.isSubtaskInTask(subtaskId, taskId);
  if (!isValidSubtask) {
    throw new NotFoundError('Subtask');
  }

  // Log activity
  await activityRepo.log({
    action: 'DELETE_SUBTASK',
    entityType: 'Subtask',
    entityId: subtaskId,
    userId,
    oldData: { title: subtask.title },
    metadata: { parentTaskId: taskId },
  });

  return subtaskRepo.deleteSubtask(subtaskId);
};

// Assignees
export const addAssignee = async (
  projectId: string,
  taskId: string,
  userId: string,
  assigneeId: string
) => {
  const role = await projectRepo.getMemberRole(projectId, userId);
  if (!role || role === 'VIEWER') {
    throw new ForbiddenError('Only members can assign users');
  }

  const task = await taskRepo.findTaskById(taskId);
  if (!task || task.projectId !== projectId) {
    throw new NotFoundError('Task');
  }

  const isAssigneeMember = await projectRepo.isProjectMember(projectId, assigneeId);
  if (!isAssigneeMember) {
    throw new ForbiddenError('User is not a member of this project');
  }

  const isAlreadyAssigned = await assigneeRepo.isUserAssigned(taskId, assigneeId);
  if (isAlreadyAssigned) {
    throw new ForbiddenError('User is already assigned to this task');
  }

  const assignee = await assigneeRepo.addAssignee(taskId, assigneeId);

  // Log activity
  await activityRepo.log({
    action: 'ADD_ASSIGNEE',
    entityType: 'Task',
    entityId: taskId,
    userId,
    newData: { assigneeId },
    metadata: { projectId },
  });

  return assignee;
};

export const removeAssignee = async (
  projectId: string,
  taskId: string,
  userId: string,
  assigneeId: string
) => {
  const canModify = await taskRepo.canUserModifyTask(taskId, userId);
  if (!canModify) {
    throw new ForbiddenError('You do not have permission to remove assignees');
  }

  const task = await taskRepo.findTaskById(taskId);
  if (!task || task.projectId !== projectId) {
    throw new NotFoundError('Task');
  }

  // Log activity
  await activityRepo.log({
    action: 'REMOVE_ASSIGNEE',
    entityType: 'Task',
    entityId: taskId,
    userId,
    oldData: { assigneeId },
    metadata: { projectId },
  });

  return assigneeRepo.removeAssignee(taskId, assigneeId);
};

export const findAssignees = async (projectId: string, taskId: string, userId: string) => {
  const isMember = await projectRepo.isProjectMember(projectId, userId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this project');
  }

  const task = await taskRepo.findTaskById(taskId);
  if (!task || task.projectId !== projectId) {
    throw new NotFoundError('Task');
  }

  return assigneeRepo.findAssigneesByTask(taskId);
};
