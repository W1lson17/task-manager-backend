import type { Request, Response } from 'express';
import {
  create,
  findAll,
  findOne,
  update,
  remove,
  restore,
  addMemberToProject,
  updateMemberRole,
  removeMemberFromProject,
} from '../services/project.service.js';
import { successResponse, paginatedResponse } from '../utils/index.js';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  AddMemberInput,
} from '../schemas/project.schema.js';

export const getAll = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { page, limit, search } = req.query as { page?: number; limit?: number; search?: string };

  const result = await findAll(userId, page || 1, limit || 20, search);

  res.json(paginatedResponse(result.projects, page || 1, limit || 20, result.total));
};

export const getOne = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const id = req.params.id as string;

  const project = await findOne(id, userId);

  res.json(successResponse(project));
};

export const createProject = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const data = req.body as CreateProjectInput;

  const project = await create(userId, data);

  res.status(201).json(successResponse(project));
};

export const updateProject = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const id = req.params.id as string;
  const data = req.body as UpdateProjectInput;

  const project = await update(id, userId, data);

  res.json(successResponse(project));
};

export const deleteProject = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const id = req.params.id as string;

  await remove(id, userId);

  res.json(successResponse({ message: 'Project deleted successfully' }));
};

export const restoreProject = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const id = req.params.id as string;

  const project = await restore(id, userId);

  res.json(successResponse(project));
};

export const addMember = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const id = req.params.id as string;
  const data = req.body as AddMemberInput;

  const member = await addMemberToProject(id, userId, data);

  res.status(201).json(successResponse(member));
};

export const updateRole = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id, userId: targetUserId } = req.params as { id: string; userId: string };
  const { role } = req.body as { role: 'ADMIN' | 'MEMBER' | 'VIEWER' };

  const member = await updateMemberRole(id, userId, targetUserId, role);

  res.json(successResponse(member));
};

export const removeMember = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id, userId: targetUserId } = req.params as { id: string; userId: string };

  await removeMemberFromProject(id, userId, targetUserId);

  res.json(successResponse({ message: 'Member removed successfully' }));
};
