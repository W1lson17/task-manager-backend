import * as projectRepo from '../repositories/project.repository.js';
import * as memberRepo from '../repositories/member.repository.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../utils/index.js';
import { prisma } from '../config/database.js';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  AddMemberInput,
} from '../schemas/project.schema.js';
import type { UserRole } from '../generated/prisma/enums.js';

export const create = async (userId: string, data: CreateProjectInput) => {
  const project = await projectRepo.createProject({
    ...data,
    ownerId: userId,
  });
  return project;
};

export const findAll = async (userId: string, page: number, limit: number, search?: string) => {
  return projectRepo.findProjectsByUser(userId, page, limit, search);
};

export const findOne = async (id: string, userId: string) => {
  const project = await projectRepo.findProjectById(id);

  if (!project) {
    throw new NotFoundError('Project');
  }

  if (project.deletedAt) {
    throw new NotFoundError('Project');
  }

  const isMember = await projectRepo.isProjectMember(id, userId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this project');
  }

  return project;
};

export const findBySlug = async (slug: string, userId: string) => {
  const project = await projectRepo.findProjectBySlug(slug);

  if (!project || project.deletedAt) {
    throw new NotFoundError('Project');
  }

  const isMember = await projectRepo.isProjectMember(project.id, userId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this project');
  }

  return project;
};

export const update = async (id: string, userId: string, data: UpdateProjectInput) => {
  const role = await projectRepo.getMemberRole(id, userId);
  if (!role) {
    throw new ForbiddenError('You are not a member of this project');
  }

  if (role !== 'OWNER' && role !== 'ADMIN') {
    throw new ForbiddenError('Only owner or admin can update project');
  }

  const project = await projectRepo.updateProject(id, data);
  return project;
};

export const remove = async (id: string, userId: string) => {
  const isOwner = await projectRepo.isProjectOwner(id, userId);
  if (!isOwner) {
    throw new ForbiddenError('Only owner can delete project');
  }

  const project = await projectRepo.deleteProject(id);
  return project;
};

export const restore = async (id: string, userId: string) => {
  const isOwner = await projectRepo.isProjectOwner(id, userId);
  if (!isOwner) {
    throw new ForbiddenError('Only owner can restore project');
  }

  const project = await projectRepo.restoreProject(id);
  return project;
};

export const addMemberToProject = async (
  projectId: string,
  userId: string,
  data: AddMemberInput
) => {
  const role = await projectRepo.getMemberRole(projectId, userId);
  if (!role || (role !== 'OWNER' && role !== 'ADMIN')) {
    throw new ForbiddenError('Only owner or admin can add members');
  }

  const existingMember = await memberRepo.findMemberByEmail(projectId, data.email);
  if (existingMember) {
    throw new ConflictError('User is already a member of this project');
  }

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new NotFoundError('User');
  }

  const member = await memberRepo.addMember(projectId, user.id, data.role as UserRole);
  return member;
};

export const updateMemberRole = async (
  projectId: string,
  userId: string,
  targetUserId: string,
  newRole: 'ADMIN' | 'MEMBER' | 'VIEWER'
) => {
  const isOwner = await projectRepo.isProjectOwner(projectId, userId);
  if (!isOwner) {
    throw new ForbiddenError('Only owner can change member roles');
  }

  const targetRole = await projectRepo.getMemberRole(projectId, targetUserId);
  if (targetRole === 'OWNER') {
    throw new ForbiddenError('Cannot change owner role');
  }

  const member = await memberRepo.updateMemberRole(projectId, targetUserId, newRole as UserRole);
  return member;
};

export const removeMemberFromProject = async (
  projectId: string,
  userId: string,
  targetUserId: string
) => {
  const isOwner = await projectRepo.isProjectOwner(projectId, userId);
  const currentRole = await projectRepo.getMemberRole(projectId, userId);
  const targetRole = await projectRepo.getMemberRole(projectId, targetUserId);

  if (targetRole === 'OWNER') {
    throw new ForbiddenError('Cannot remove owner from project');
  }

  if (!isOwner && currentRole !== 'ADMIN' && userId !== targetUserId) {
    throw new ForbiddenError('You cannot remove this member');
  }

  const member = await memberRepo.removeMember(projectId, targetUserId);
  return member;
};
