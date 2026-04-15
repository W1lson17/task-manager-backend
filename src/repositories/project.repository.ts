import { prisma } from '../config/database.js';
import type { CreateProjectInput, UpdateProjectInput } from '../schemas/project.schema.js';

export const createProject = async (data: CreateProjectInput & { ownerId: string }) => {
  const { name, description, color, slug } = data;

  // Generate slug if not provided
  const projectSlug =
    slug ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const project = await prisma.project.create({
    data: {
      name,
      description,
      color,
      slug: projectSlug,
      ownerId: data.ownerId,
      members: {
        create: {
          userId: data.ownerId,
          role: 'OWNER',
        },
      },
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          tasks: true,
          members: true,
        },
      },
    },
  });

  return project;
};

export const findProjectById = async (id: string) => {
  return prisma.project.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
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
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });
};

export const findProjectBySlug = async (slug: string) => {
  return prisma.project.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const findProjectsByUser = async (
  userId: string,
  page: number,
  limit: number,
  search?: string
) => {
  const skip = (page - 1) * limit;

  const where = search
    ? {
        members: {
          some: { userId },
        },
        deletedAt: null,
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {
        members: {
          some: { userId },
        },
        deletedAt: null,
      };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return { projects, total };
};

export const updateProject = async (id: string, data: UpdateProjectInput) => {
  const project = await prisma.project.update({
    where: { id },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return project;
};

export const deleteProject = async (id: string) => {
  // Soft delete
  return prisma.project.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

export const restoreProject = async (id: string) => {
  return prisma.project.update({
    where: { id },
    data: { deletedAt: null },
  });
};

export const isProjectMember = async (projectId: string, userId: string) => {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
  return !!member;
};

export const isProjectOwner = async (projectId: string, userId: string) => {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
  return member?.role === 'OWNER';
};

export const getMemberRole = async (projectId: string, userId: string) => {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
  return member?.role || null;
};
