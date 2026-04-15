import { prisma } from '../config/database.js';

export const createComment = async (
  taskId: string,
  authorId: string,
  data: { content: string }
) => {
  return prisma.comment.create({
    data: {
      taskId,
      authorId,
      content: data.content,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });
};

export const findCommentById = async (commentId: string) => {
  return prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      task: {
        select: {
          id: true,
          projectId: true,
        },
      },
    },
  });
};

export const findCommentsByTask = async (taskId: string, page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { taskId },
      include: {
        author: {
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
    prisma.comment.count({ where: { taskId } }),
  ]);

  return {
    comments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateComment = async (commentId: string, data: { content: string }) => {
  return prisma.comment.update({
    where: { id: commentId },
    data: {
      content: data.content,
      editedAt: new Date(),
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });
};

export const deleteComment = async (commentId: string) => {
  return prisma.comment.delete({
    where: { id: commentId },
  });
};

export const isCommentAuthor = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, authorId: userId },
  });
  return !!comment;
};

export const isCommentInTask = async (commentId: string, taskId: string) => {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, taskId },
  });
  return !!comment;
};
