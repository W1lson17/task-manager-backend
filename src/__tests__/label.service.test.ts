import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from './setup';

// Mock repositories
vi.mock('../repositories/label.repository', () => ({
  createLabel: vi.fn(),
  findLabelById: vi.fn(),
  findLabelsByProject: vi.fn(),
  updateLabel: vi.fn(),
  deleteLabel: vi.fn(),
  isLabelAssignedToTask: vi.fn(),
  addLabelToTask: vi.fn(),
  removeLabelFromTask: vi.fn(),
  findLabelsByTask: vi.fn(),
  default: {
    createLabel: vi.fn(),
    findLabelById: vi.fn(),
    findLabelsByProject: vi.fn(),
    updateLabel: vi.fn(),
    deleteLabel: vi.fn(),
    isLabelAssignedToTask: vi.fn(),
    addLabelToTask: vi.fn(),
    removeLabelFromTask: vi.fn(),
    findLabelsByTask: vi.fn(),
  },
}));

vi.mock('../repositories/project.repository', () => ({
  getMemberRole: vi.fn(),
  isProjectMember: vi.fn(),
  default: {
    getMemberRole: vi.fn(),
    isProjectMember: vi.fn(),
  },
}));

vi.mock('../repositories/task.repository', () => ({
  findTaskById: vi.fn(),
  default: {
    findTaskById: vi.fn(),
  },
}));

// Import after mocks
import * as labelService from '../services/label.service';
import * as labelRepo from '../repositories/label.repository';
import * as projectRepo from '../repositories/project.repository';
import * as taskRepo from '../repositories/task.repository';

describe('Label Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a label as admin', async () => {
      const mockLabel = {
        id: 'label-123',
        projectId: 'project-123',
        name: 'Bug',
        color: '#FF0000',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      projectRepo.getMemberRole.mockResolvedValue('ADMIN');
      labelRepo.createLabel.mockResolvedValue(mockLabel);

      const result = await labelService.create('project-123', 'user-123', {
        name: 'Bug',
        color: '#FF0000',
      });

      expect(result).toEqual(mockLabel);
      expect(labelRepo.createLabel).toHaveBeenCalled();
    });

    it('should create a label as member', async () => {
      const mockLabel = {
        id: 'label-123',
        projectId: 'project-123',
        name: 'Feature',
        color: '#00FF00',
      };

      projectRepo.getMemberRole.mockResolvedValue('MEMBER');
      labelRepo.createLabel.mockResolvedValue(mockLabel);

      const result = await labelService.create('project-123', 'user-123', {
        name: 'Feature',
        color: '#00FF00',
      });

      expect(result).toEqual(mockLabel);
    });

    it('should throw ForbiddenError for non-member', async () => {
      projectRepo.getMemberRole.mockResolvedValue(null);

      await expect(
        labelService.create('project-123', 'non-member', { name: 'Bug' })
      ).rejects.toThrow('You are not a member of this project');
    });

    it('should throw ForbiddenError for viewer', async () => {
      projectRepo.getMemberRole.mockResolvedValue('VIEWER');

      await expect(labelService.create('project-123', 'viewer', { name: 'Bug' })).rejects.toThrow(
        'Viewers cannot create labels'
      );
    });
  });

  describe('findAll', () => {
    it('should return labels for project member', async () => {
      const mockLabels = [
        { id: 'label-1', name: 'Bug', color: '#FF0000' },
        { id: 'label-2', name: 'Feature', color: '#00FF00' },
      ];

      projectRepo.isProjectMember.mockResolvedValue(true);
      labelRepo.findLabelsByProject.mockResolvedValue(mockLabels);

      const result = await labelService.findAll('project-123', 'user-123');

      expect(result).toHaveLength(2);
    });

    it('should throw ForbiddenError for non-member', async () => {
      projectRepo.isProjectMember.mockResolvedValue(false);

      await expect(labelService.findAll('project-123', 'non-member')).rejects.toThrow(
        'You are not a member of this project'
      );
    });
  });

  describe('findOne', () => {
    it('should return label for project member', async () => {
      const mockLabel = {
        id: 'label-123',
        projectId: 'project-123',
        name: 'Bug',
        color: '#FF0000',
      };

      labelRepo.findLabelById.mockResolvedValue(mockLabel);
      projectRepo.isProjectMember.mockResolvedValue(true);

      const result = await labelService.findOne('label-123', 'user-123');

      expect(result).toEqual(mockLabel);
    });

    it('should throw NotFoundError for non-existent label', async () => {
      labelRepo.findLabelById.mockResolvedValue(null);

      await expect(labelService.findOne('non-existent', 'user-123')).rejects.toThrow('Label');
    });

    it('should throw ForbiddenError for non-member', async () => {
      labelRepo.findLabelById.mockResolvedValue({
        id: 'label-123',
        projectId: 'project-123',
      });
      projectRepo.isProjectMember.mockResolvedValue(false);

      await expect(labelService.findOne('label-123', 'non-member')).rejects.toThrow(
        'You are not a member of this project'
      );
    });
  });

  describe('update', () => {
    it('should update label as admin', async () => {
      const mockLabel = {
        id: 'label-123',
        projectId: 'project-123',
        name: 'Updated Bug',
        color: '#FF0000',
      };

      labelRepo.findLabelById.mockResolvedValue({ id: 'label-123', projectId: 'project-123' });
      projectRepo.getMemberRole.mockResolvedValue('ADMIN');
      labelRepo.updateLabel.mockResolvedValue(mockLabel);

      const result = await labelService.update('label-123', 'user-123', { name: 'Updated Bug' });

      expect(result).toEqual(mockLabel);
    });

    it('should throw NotFoundError for non-existent label', async () => {
      labelRepo.findLabelById.mockResolvedValue(null);

      await expect(
        labelService.update('non-existent', 'user-123', { name: 'New' })
      ).rejects.toThrow('Label');
    });

    it('should throw ForbiddenError for viewer', async () => {
      labelRepo.findLabelById.mockResolvedValue({ id: 'label-123', projectId: 'project-123' });
      projectRepo.getMemberRole.mockResolvedValue('VIEWER');

      await expect(labelService.update('label-123', 'viewer', { name: 'New' })).rejects.toThrow(
        'Only members can update labels'
      );
    });
  });

  describe('remove', () => {
    it('should delete label as admin', async () => {
      labelRepo.findLabelById.mockResolvedValue({ id: 'label-123', projectId: 'project-123' });
      projectRepo.getMemberRole.mockResolvedValue('ADMIN');
      labelRepo.deleteLabel.mockResolvedValue(undefined);

      await labelService.remove('label-123', 'user-123');

      expect(labelRepo.deleteLabel).toHaveBeenCalledWith('label-123');
    });

    it('should throw NotFoundError for non-existent label', async () => {
      labelRepo.findLabelById.mockResolvedValue(null);

      await expect(labelService.remove('non-existent', 'user-123')).rejects.toThrow('Label');
    });

    it('should throw ForbiddenError for viewer', async () => {
      labelRepo.findLabelById.mockResolvedValue({ id: 'label-123', projectId: 'project-123' });
      projectRepo.getMemberRole.mockResolvedValue('VIEWER');

      await expect(labelService.remove('label-123', 'viewer')).rejects.toThrow(
        'Only members can delete labels'
      );
    });
  });

  describe('addLabelToTask', () => {
    it('should add label to task as member', async () => {
      projectRepo.getMemberRole.mockResolvedValue('MEMBER');
      taskRepo.findTaskById.mockResolvedValue({ id: 'task-123', projectId: 'project-123' });
      labelRepo.findLabelById.mockResolvedValue({ id: 'label-123', projectId: 'project-123' });
      labelRepo.isLabelAssignedToTask.mockResolvedValue(false);
      labelRepo.addLabelToTask.mockResolvedValue(undefined);

      await labelService.addLabelToTask('project-123', 'task-123', 'label-123', 'user-123');

      expect(labelRepo.addLabelToTask).toHaveBeenCalledWith('task-123', 'label-123');
    });

    it('should throw ForbiddenError for viewer', async () => {
      projectRepo.getMemberRole.mockResolvedValue('VIEWER');

      await expect(
        labelService.addLabelToTask('project-123', 'task-123', 'label-123', 'viewer')
      ).rejects.toThrow('Viewers cannot assign labels');
    });

    it('should throw NotFoundError for non-existent task', async () => {
      projectRepo.getMemberRole.mockResolvedValue('MEMBER');
      taskRepo.findTaskById.mockResolvedValue(null);

      await expect(
        labelService.addLabelToTask('project-123', 'non-existent', 'label-123', 'user-123')
      ).rejects.toThrow('Task');
    });

    it('should throw NotFoundError for task in different project', async () => {
      projectRepo.getMemberRole.mockResolvedValue('MEMBER');
      taskRepo.findTaskById.mockResolvedValue({ id: 'task-123', projectId: 'other-project' });

      await expect(
        labelService.addLabelToTask('project-123', 'task-123', 'label-123', 'user-123')
      ).rejects.toThrow('Task');
    });

    it('should throw NotFoundError for non-existent label', async () => {
      projectRepo.getMemberRole.mockResolvedValue('MEMBER');
      taskRepo.findTaskById.mockResolvedValue({ id: 'task-123', projectId: 'project-123' });
      labelRepo.findLabelById.mockResolvedValue(null);

      await expect(
        labelService.addLabelToTask('project-123', 'task-123', 'non-existent', 'user-123')
      ).rejects.toThrow('Label');
    });

    it('should throw ConflictError for already assigned label', async () => {
      projectRepo.getMemberRole.mockResolvedValue('MEMBER');
      taskRepo.findTaskById.mockResolvedValue({ id: 'task-123', projectId: 'project-123' });
      labelRepo.findLabelById.mockResolvedValue({ id: 'label-123', projectId: 'project-123' });
      labelRepo.isLabelAssignedToTask.mockResolvedValue(true);

      await expect(
        labelService.addLabelToTask('project-123', 'task-123', 'label-123', 'user-123')
      ).rejects.toThrow('Label is already assigned to this task');
    });
  });

  describe('removeLabelFromTask', () => {
    it('should remove label from task as member', async () => {
      projectRepo.getMemberRole.mockResolvedValue('MEMBER');
      taskRepo.findTaskById.mockResolvedValue({ id: 'task-123', projectId: 'project-123' });
      labelRepo.removeLabelFromTask.mockResolvedValue(undefined);

      await labelService.removeLabelFromTask('project-123', 'task-123', 'label-123', 'user-123');

      expect(labelRepo.removeLabelFromTask).toHaveBeenCalledWith('task-123', 'label-123');
    });

    it('should throw ForbiddenError for viewer', async () => {
      projectRepo.getMemberRole.mockResolvedValue('VIEWER');

      await expect(
        labelService.removeLabelFromTask('project-123', 'task-123', 'label-123', 'viewer')
      ).rejects.toThrow('Viewers cannot remove labels');
    });
  });

  describe('findTaskLabels', () => {
    it('should return labels for task', async () => {
      const mockLabels = [
        { id: 'label-1', name: 'Bug', color: '#FF0000' },
        { id: 'label-2', name: 'Feature', color: '#00FF00' },
      ];

      projectRepo.isProjectMember.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({ id: 'task-123', projectId: 'project-123' });
      labelRepo.findLabelsByTask.mockResolvedValue(mockLabels);

      const result = await labelService.findTaskLabels('project-123', 'task-123', 'user-123');

      expect(result).toHaveLength(2);
    });

    it('should throw ForbiddenError for non-member', async () => {
      projectRepo.isProjectMember.mockResolvedValue(false);

      await expect(
        labelService.findTaskLabels('project-123', 'task-123', 'non-member')
      ).rejects.toThrow('You are not a member of this project');
    });

    it('should throw NotFoundError for task in different project', async () => {
      projectRepo.isProjectMember.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({ id: 'task-123', projectId: 'other-project' });

      await expect(
        labelService.findTaskLabels('project-123', 'task-123', 'user-123')
      ).rejects.toThrow('Task');
    });
  });
});
