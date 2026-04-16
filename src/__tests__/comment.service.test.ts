import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from './setup';

// Mock repositories
vi.mock('../repositories/comment.repository', () => ({
  createComment: vi.fn(),
  findCommentById: vi.fn(),
  findCommentsByTask: vi.fn(),
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
  default: {
    createComment: vi.fn(),
    findCommentById: vi.fn(),
    findCommentsByTask: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
  },
}));

vi.mock('../repositories/project.repository', () => ({
  isProjectMember: vi.fn(),
  default: {
    isProjectMember: vi.fn(),
  },
}));

vi.mock('../repositories/activity.repository', () => ({
  log: vi.fn(),
  default: {
    log: vi.fn(),
  },
}));

// Import after mocks
import * as commentService from '../services/comment.service';
import * as commentRepo from '../repositories/comment.repository';
import * as projectRepo from '../repositories/project.repository';
import * as activityRepo from '../repositories/activity.repository';

describe('Comment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a comment as project member', async () => {
      const mockComment = {
        id: 'comment-123',
        taskId: 'task-123',
        authorId: 'user-123',
        content: 'Test comment',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.task.findUnique.mockResolvedValue({ projectId: 'project-123' });
      projectRepo.isProjectMember.mockResolvedValue(true);
      commentRepo.createComment.mockResolvedValue(mockComment);
      activityRepo.log.mockResolvedValue(undefined);

      const result = await commentService.create('task-123', 'user-123', {
        content: 'Test comment',
      });

      expect(result).toEqual(mockComment);
      expect(commentRepo.createComment).toHaveBeenCalled();
      expect(activityRepo.log).toHaveBeenCalled();
    });

    it('should throw NotFoundError for non-existent task', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      await expect(
        commentService.create('non-existent', 'user-123', { content: 'Test' })
      ).rejects.toThrow('Task');
    });

    it('should throw ForbiddenError for non-member', async () => {
      prismaMock.task.findUnique.mockResolvedValue({ projectId: 'project-123' });
      projectRepo.isProjectMember.mockResolvedValue(false);

      await expect(
        commentService.create('task-123', 'non-member', { content: 'Test' })
      ).rejects.toThrow('You are not a member of this project');
    });
  });

  describe('findAll', () => {
    it('should return paginated comments', async () => {
      const mockComments = {
        comments: [
          { id: 'comment-1', content: 'Comment 1' },
          { id: 'comment-2', content: 'Comment 2' },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      };

      prismaMock.task.findUnique.mockResolvedValue({ projectId: 'project-123' });
      projectRepo.isProjectMember.mockResolvedValue(true);
      commentRepo.findCommentsByTask.mockResolvedValue(mockComments);

      const result = await commentService.findAll('task-123', 'user-123', 1, 10);

      expect(result.comments).toHaveLength(2);
      expect(commentRepo.findCommentsByTask).toHaveBeenCalledWith('task-123', 1, 10);
    });

    it('should throw NotFoundError for non-existent task', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      await expect(commentService.findAll('non-existent', 'user-123', 1, 10)).rejects.toThrow(
        'Task'
      );
    });

    it('should throw ForbiddenError for non-member', async () => {
      prismaMock.task.findUnique.mockResolvedValue({ projectId: 'project-123' });
      projectRepo.isProjectMember.mockResolvedValue(false);

      await expect(commentService.findAll('task-123', 'non-member', 1, 10)).rejects.toThrow(
        'You are not a member of this project'
      );
    });
  });

  describe('findOne', () => {
    it('should return comment for project member', async () => {
      const mockComment = {
        id: 'comment-123',
        content: 'Test comment',
        authorId: 'user-123',
        task: { projectId: 'project-123' },
      };

      commentRepo.findCommentById.mockResolvedValue(mockComment);
      projectRepo.isProjectMember.mockResolvedValue(true);

      const result = await commentService.findOne('comment-123', 'user-123');

      expect(result).toEqual(mockComment);
    });

    it('should throw NotFoundError for non-existent comment', async () => {
      commentRepo.findCommentById.mockResolvedValue(null);

      await expect(commentService.findOne('non-existent', 'user-123')).rejects.toThrow('Comment');
    });

    it('should throw ForbiddenError for non-member', async () => {
      commentRepo.findCommentById.mockResolvedValue({
        id: 'comment-123',
        task: { projectId: 'project-123' },
      });
      projectRepo.isProjectMember.mockResolvedValue(false);

      await expect(commentService.findOne('comment-123', 'non-member')).rejects.toThrow(
        'You are not a member of this project'
      );
    });
  });

  describe('update', () => {
    it('should update comment as author', async () => {
      const mockComment = {
        id: 'comment-123',
        content: 'Updated comment',
        authorId: 'user-123',
        task: { projectId: 'project-123' },
        taskId: 'task-123',
      };

      const oldComment = { ...mockComment, content: 'Old comment' };

      commentRepo.findCommentById.mockResolvedValue(oldComment);
      commentRepo.updateComment.mockResolvedValue(mockComment);
      activityRepo.log.mockResolvedValue(undefined);

      const result = await commentService.update('comment-123', 'user-123', {
        content: 'Updated comment',
      });

      expect(result).toEqual(mockComment);
      expect(activityRepo.log).toHaveBeenCalled();
    });

    it('should throw NotFoundError for non-existent comment', async () => {
      commentRepo.findCommentById.mockResolvedValue(null);

      await expect(
        commentService.update('non-existent', 'user-123', { content: 'Updated' })
      ).rejects.toThrow('Comment');
    });

    it('should throw ForbiddenError for non-author', async () => {
      commentRepo.findCommentById.mockResolvedValue({
        id: 'comment-123',
        authorId: 'other-user',
        task: { projectId: 'project-123' },
      });

      await expect(
        commentService.update('comment-123', 'user-123', { content: 'Updated' })
      ).rejects.toThrow('You can only edit your own comments');
    });
  });

  describe('remove', () => {
    it('should delete comment as author', async () => {
      const mockComment = {
        id: 'comment-123',
        content: 'Test comment',
        authorId: 'user-123',
        task: { projectId: 'project-123' },
        taskId: 'task-123',
      };

      commentRepo.findCommentById.mockResolvedValue(mockComment);
      commentRepo.deleteComment.mockResolvedValue(mockComment);
      activityRepo.log.mockResolvedValue(undefined);

      await commentService.remove('comment-123', 'user-123');

      expect(commentRepo.deleteComment).toHaveBeenCalledWith('comment-123');
      expect(activityRepo.log).toHaveBeenCalled();
    });

    it('should throw NotFoundError for non-existent comment', async () => {
      commentRepo.findCommentById.mockResolvedValue(null);

      await expect(commentService.remove('non-existent', 'user-123')).rejects.toThrow('Comment');
    });

    it('should throw ForbiddenError for non-author', async () => {
      commentRepo.findCommentById.mockResolvedValue({
        id: 'comment-123',
        authorId: 'other-user',
        task: { projectId: 'project-123' },
      });

      await expect(commentService.remove('comment-123', 'user-123')).rejects.toThrow(
        'You can only delete your own comments'
      );
    });
  });
});
