import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock repositories
vi.mock('../repositories/activity.repository', () => ({
  log: vi.fn(),
  findByProject: vi.fn(),
  findByEntity: vi.fn(),
  default: {
    log: vi.fn(),
    findByProject: vi.fn(),
    findByEntity: vi.fn(),
  },
}));

vi.mock('../repositories/project.repository', () => ({
  isProjectMember: vi.fn(),
  default: {
    isProjectMember: vi.fn(),
  },
}));

// Import after mocks
import * as activityService from '../services/activity.service';
import * as activityRepo from '../repositories/activity.repository';
import * as projectRepo from '../repositories/project.repository';

describe('Activity Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('log', () => {
    it('should log activity', async () => {
      const mockActivity = {
        id: 'activity-123',
        action: 'CREATE_TASK',
        entityType: 'Task',
        entityId: 'task-123',
        userId: 'user-123',
        createdAt: new Date(),
      };

      activityRepo.log.mockResolvedValue(mockActivity);

      const result = await activityService.log(
        'CREATE_TASK',
        'Task',
        'task-123',
        'user-123',
        undefined,
        { title: 'New Task' }
      );

      expect(result).toEqual(mockActivity);
      expect(activityRepo.log).toHaveBeenCalledWith({
        action: 'CREATE_TASK',
        entityType: 'Task',
        entityId: 'task-123',
        userId: 'user-123',
        oldData: undefined,
        newData: { title: 'New Task' },
        metadata: undefined,
      });
    });

    it('should log activity with old and new data', async () => {
      activityRepo.log.mockResolvedValue({ id: 'activity-123' });

      await activityService.log(
        'UPDATE_TASK',
        'Task',
        'task-123',
        'user-123',
        { title: 'Old Title' },
        { title: 'New Title' }
      );

      expect(activityRepo.log).toHaveBeenCalledWith({
        action: 'UPDATE_TASK',
        entityType: 'Task',
        entityId: 'task-123',
        userId: 'user-123',
        oldData: { title: 'Old Title' },
        newData: { title: 'New Title' },
        metadata: undefined,
      });
    });

    it('should log activity with metadata', async () => {
      activityRepo.log.mockResolvedValue({ id: 'activity-123' });

      await activityService.log(
        'ADD_COMMENT',
        'Comment',
        'comment-123',
        'user-123',
        undefined,
        undefined,
        { projectId: 'project-123', taskId: 'task-123' }
      );

      expect(activityRepo.log).toHaveBeenCalledWith({
        action: 'ADD_COMMENT',
        entityType: 'Comment',
        entityId: 'comment-123',
        userId: 'user-123',
        oldData: undefined,
        newData: undefined,
        metadata: { projectId: 'project-123', taskId: 'task-123' },
      });
    });
  });

  describe('findByProject', () => {
    it('should return paginated activity for project member', async () => {
      const mockActivity = {
        activities: [
          {
            id: 'activity-1',
            action: 'CREATE_TASK',
            entityType: 'Task',
            entityId: 'task-1',
            userId: 'user-1',
          },
          {
            id: 'activity-2',
            action: 'UPDATE_TASK',
            entityType: 'Task',
            entityId: 'task-2',
            userId: 'user-2',
          },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      };

      projectRepo.isProjectMember.mockResolvedValue(true);
      activityRepo.findByProject.mockResolvedValue(mockActivity);

      const result = await activityService.findByProject('project-123', 'user-123', 1, 10);

      expect(result.activities).toHaveLength(2);
      expect(activityRepo.findByProject).toHaveBeenCalledWith('project-123', 1, 10, undefined);
    });

    it('should pass filters to repository', async () => {
      projectRepo.isProjectMember.mockResolvedValue(true);
      activityRepo.findByProject.mockResolvedValue({
        activities: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      await activityService.findByProject('project-123', 'user-123', 1, 10, {
        entityType: 'Task',
        action: 'CREATE',
      });

      expect(activityRepo.findByProject).toHaveBeenCalledWith('project-123', 1, 10, {
        entityType: 'Task',
        action: 'CREATE',
      });
    });

    it('should throw ForbiddenError for non-member', async () => {
      projectRepo.isProjectMember.mockResolvedValue(false);

      await expect(
        activityService.findByProject('project-123', 'non-member', 1, 10)
      ).rejects.toThrow('You are not a member of this project');
    });
  });

  describe('findByEntity', () => {
    it('should return paginated activity for entity', async () => {
      const mockActivity = {
        activities: [
          {
            id: 'activity-1',
            action: 'UPDATE_TASK',
            entityType: 'Task',
            entityId: 'task-123',
            userId: 'user-1',
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      projectRepo.isProjectMember.mockResolvedValue(true);
      activityRepo.findByEntity.mockResolvedValue(mockActivity);

      const result = await activityService.findByEntity(
        'project-123',
        'Task',
        'task-123',
        'user-123',
        1,
        10
      );

      expect(result.activities).toHaveLength(1);
      expect(activityRepo.findByEntity).toHaveBeenCalledWith('Task', 'task-123', 1, 10);
    });

    it('should throw ForbiddenError for non-member', async () => {
      projectRepo.isProjectMember.mockResolvedValue(false);

      await expect(
        activityService.findByEntity('project-123', 'Task', 'task-123', 'non-member', 1, 10)
      ).rejects.toThrow('You are not a member of this project');
    });
  });
});
