import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from './setup';

// Mock repositories
vi.mock('../repositories/task.repository', () => ({
  createTask: vi.fn(),
  findTaskById: vi.fn(),
  findTasksByProject: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  restoreTask: vi.fn(),
  canUserModifyTask: vi.fn(),
  default: {
    createTask: vi.fn(),
    findTaskById: vi.fn(),
    findTasksByProject: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    restoreTask: vi.fn(),
    canUserModifyTask: vi.fn(),
  },
}));

vi.mock('../repositories/subtask.repository', () => ({
  createSubtask: vi.fn(),
  findSubtasksByTask: vi.fn(),
  findSubtaskById: vi.fn(),
  updateSubtask: vi.fn(),
  deleteSubtask: vi.fn(),
  isSubtaskInTask: vi.fn(),
  default: {
    createSubtask: vi.fn(),
    findSubtasksByTask: vi.fn(),
    findSubtaskById: vi.fn(),
    updateSubtask: vi.fn(),
    deleteSubtask: vi.fn(),
    isSubtaskInTask: vi.fn(),
  },
}));

vi.mock('../repositories/assignee.repository', () => ({
  addAssignee: vi.fn(),
  removeAssignee: vi.fn(),
  findAssigneesByTask: vi.fn(),
  isUserAssigned: vi.fn(),
  default: {
    addAssignee: vi.fn(),
    removeAssignee: vi.fn(),
    findAssigneesByTask: vi.fn(),
    isUserAssigned: vi.fn(),
  },
}));

vi.mock('../repositories/project.repository', () => ({
  isProjectMember: vi.fn(),
  getMemberRole: vi.fn(),
  default: {
    isProjectMember: vi.fn(),
    getMemberRole: vi.fn(),
  },
}));

vi.mock('../repositories/activity.repository', () => ({
  log: vi.fn(),
  default: {
    log: vi.fn(),
  },
}));

// Import after mocks
import * as taskService from '../services/task.service';
import * as taskRepo from '../repositories/task.repository';
import * as subtaskRepo from '../repositories/subtask.repository';
import * as assigneeRepo from '../repositories/assignee.repository';
import * as projectRepo from '../repositories/project.repository';
import * as activityRepo from '../repositories/activity.repository';

describe('Task Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task as member', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'New Task',
        projectId: 'project-123',
        createdById: 'user-123',
        status: 'TODO',
        priority: 'MEDIUM',
      };

      projectRepo.getMemberRole.mockResolvedValue('MEMBER');
      taskRepo.createTask.mockResolvedValue(mockTask);
      activityRepo.log.mockResolvedValue(undefined);

      const result = await taskService.create('project-123', 'user-123', { title: 'New Task' });

      expect(result).toEqual(mockTask);
      expect(activityRepo.log).toHaveBeenCalled();
    });

    it('should create task with all fields', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Full Task',
        description: 'Description',
        projectId: 'project-123',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
      };

      projectRepo.getMemberRole.mockResolvedValue('ADMIN');
      taskRepo.createTask.mockResolvedValue(mockTask);
      activityRepo.log.mockResolvedValue(undefined);

      const result = await taskService.create('project-123', 'user-123', {
        title: 'Full Task',
        description: 'Description',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
      });

      expect(result).toEqual(mockTask);
    });

    it('should throw ForbiddenError for viewer', async () => {
      projectRepo.getMemberRole.mockResolvedValue('VIEWER');

      await expect(
        taskService.create('project-123', 'viewer', { title: 'New Task' })
      ).rejects.toThrow('Viewers cannot create tasks');
    });

    it('should throw ForbiddenError for non-member', async () => {
      projectRepo.getMemberRole.mockResolvedValue(null);

      await expect(
        taskService.create('project-123', 'non-member', { title: 'New Task' })
      ).rejects.toThrow('You are not a member of this project');
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks for project member', async () => {
      const mockResult = {
        tasks: [{ id: 'task-1' }, { id: 'task-2' }],
        total: 2,
        page: 1,
        totalPages: 1,
      };

      projectRepo.isProjectMember.mockResolvedValue(true);
      taskRepo.findTasksByProject.mockResolvedValue(mockResult);

      const result = await taskService.findAll('project-123', 'user-123', 1, 10);

      expect(result.tasks).toHaveLength(2);
      expect(taskRepo.findTasksByProject).toHaveBeenCalledWith('project-123', 1, 10, undefined);
    });

    it('should pass filters to repository', async () => {
      projectRepo.isProjectMember.mockResolvedValue(true);
      taskRepo.findTasksByProject.mockResolvedValue({
        tasks: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      await taskService.findAll('project-123', 'user-123', 1, 10, {
        status: 'TODO',
        priority: 'HIGH',
        search: 'bug',
      });

      expect(taskRepo.findTasksByProject).toHaveBeenCalledWith('project-123', 1, 10, {
        status: 'TODO',
        priority: 'HIGH',
        search: 'bug',
      });
    });

    it('should throw ForbiddenError for non-member', async () => {
      projectRepo.isProjectMember.mockResolvedValue(false);

      await expect(taskService.findAll('project-123', 'non-member', 1, 10)).rejects.toThrow(
        'You are not a member of this project'
      );
    });
  });

  describe('findOne', () => {
    it('should return task for project member', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'My Task',
        projectId: 'project-123',
      };

      projectRepo.isProjectMember.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue(mockTask);

      const result = await taskService.findOne('project-123', 'task-123', 'user-123');

      expect(result).toEqual(mockTask);
    });

    it('should throw ForbiddenError for non-member', async () => {
      projectRepo.isProjectMember.mockResolvedValue(false);

      await expect(taskService.findOne('project-123', 'task-123', 'non-member')).rejects.toThrow(
        'You are not a member of this project'
      );
    });

    it('should throw NotFoundError for non-existent task', async () => {
      projectRepo.isProjectMember.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue(null);

      await expect(taskService.findOne('project-123', 'non-existent', 'user-123')).rejects.toThrow(
        'Task not found'
      );
    });

    it('should throw NotFoundError for task in different project', async () => {
      projectRepo.isProjectMember.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'different-project',
      });

      await expect(taskService.findOne('project-123', 'task-123', 'user-123')).rejects.toThrow(
        'Task not found'
      );
    });
  });

  describe('update', () => {
    it('should update task as modifier', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Updated Task',
        projectId: 'project-123',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
      };

      taskRepo.canUserModifyTask.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'project-123',
        title: 'Old Task',
        status: 'TODO',
        priority: 'MEDIUM',
      });
      taskRepo.updateTask.mockResolvedValue(mockTask);
      activityRepo.log.mockResolvedValue(undefined);

      const result = await taskService.update('project-123', 'task-123', 'user-123', {
        title: 'Updated Task',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
      });

      expect(result).toEqual(mockTask);
      expect(activityRepo.log).toHaveBeenCalled();
    });

    it('should handle nullable dates', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'project-123',
        title: 'Task',
        status: 'TODO',
        priority: 'MEDIUM',
      });
      taskRepo.updateTask.mockResolvedValue({ id: 'task-123' });
      activityRepo.log.mockResolvedValue(undefined);

      await taskService.update('project-123', 'task-123', 'user-123', {
        dueDate: null,
      });

      expect(taskRepo.updateTask).toHaveBeenCalled();
    });

    it('should throw ForbiddenError for non-modifier', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(false);

      await expect(
        taskService.update('project-123', 'task-123', 'viewer', { title: 'New' })
      ).rejects.toThrow('You do not have permission to modify this task');
    });

    it('should throw NotFoundError for task in different project', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'other-project',
      });

      await expect(
        taskService.update('project-123', 'task-123', 'user-123', { title: 'New' })
      ).rejects.toThrow('Task not found');
    });
  });

  describe('remove', () => {
    it('should soft delete task as modifier', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'project-123',
        title: 'Deleted Task',
      });
      taskRepo.deleteTask.mockResolvedValue({
        id: 'task-123',
        deletedAt: new Date(),
      });
      activityRepo.log.mockResolvedValue(undefined);

      const result = await taskService.remove('project-123', 'task-123', 'user-123');

      expect(result).toBeDefined();
      expect(activityRepo.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenError for non-modifier', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(false);

      await expect(taskService.remove('project-123', 'task-123', 'viewer')).rejects.toThrow(
        'You do not have permission to delete this task'
      );
    });

    it('should throw NotFoundError for task in different project', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'other-project',
      });

      await expect(taskService.remove('project-123', 'task-123', 'user-123')).rejects.toThrow(
        'Task not found'
      );
    });
  });

  describe('restore', () => {
    it('should restore task as modifier', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Restored Task',
        deletedAt: null,
      };

      taskRepo.canUserModifyTask.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'project-123',
        deletedAt: new Date(),
      });
      taskRepo.restoreTask.mockResolvedValue(mockTask);
      activityRepo.log.mockResolvedValue(undefined);

      const result = await taskService.restore('project-123', 'task-123', 'user-123');

      expect(result).toEqual(mockTask);
      expect(activityRepo.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenError for non-modifier', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(false);

      await expect(taskService.restore('project-123', 'task-123', 'viewer')).rejects.toThrow(
        'You do not have permission to restore this task'
      );
    });
  });

  describe('createSubtask', () => {
    it('should create subtask as modifier', async () => {
      const mockSubtask = {
        id: 'subtask-123',
        taskId: 'task-123',
        title: 'New Subtask',
        isDone: false,
      };

      taskRepo.canUserModifyTask.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'project-123',
      });
      subtaskRepo.createSubtask.mockResolvedValue(mockSubtask);
      activityRepo.log.mockResolvedValue(undefined);

      const result = await taskService.createSubtask('project-123', 'task-123', 'user-123', {
        title: 'New Subtask',
      });

      expect(result).toEqual(mockSubtask);
      expect(activityRepo.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenError for non-modifier', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(false);

      await expect(
        taskService.createSubtask('project-123', 'task-123', 'viewer', { title: 'Subtask' })
      ).rejects.toThrow('You do not have permission to add subtasks');
    });

    it('should throw NotFoundError for task in different project', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'other-project',
      });

      await expect(
        taskService.createSubtask('project-123', 'task-123', 'user-123', { title: 'Subtask' })
      ).rejects.toThrow('Task not found');
    });
  });

  describe('findSubtasks', () => {
    it('should return subtasks for project member', async () => {
      const mockSubtasks = [
        { id: 'subtask-1', title: 'Subtask 1' },
        { id: 'subtask-2', title: 'Subtask 2' },
      ];

      projectRepo.isProjectMember.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'project-123',
      });
      subtaskRepo.findSubtasksByTask.mockResolvedValue(mockSubtasks);

      const result = await taskService.findSubtasks('project-123', 'task-123', 'user-123');

      expect(result).toHaveLength(2);
    });

    it('should throw ForbiddenError for non-member', async () => {
      projectRepo.isProjectMember.mockResolvedValue(false);

      await expect(
        taskService.findSubtasks('project-123', 'task-123', 'non-member')
      ).rejects.toThrow('You are not a member of this project');
    });

    it('should throw NotFoundError for task in different project', async () => {
      projectRepo.isProjectMember.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'other-project',
      });

      await expect(taskService.findSubtasks('project-123', 'task-123', 'user-123')).rejects.toThrow(
        'Task not found'
      );
    });
  });

  describe('updateSubtask', () => {
    it('should update subtask as modifier', async () => {
      const mockSubtask = {
        id: 'subtask-123',
        taskId: 'task-123',
        title: 'Updated Subtask',
        isDone: true,
      };

      taskRepo.canUserModifyTask.mockResolvedValue(true);
      subtaskRepo.findSubtaskById.mockResolvedValue({
        id: 'subtask-123',
        taskId: 'task-123',
        title: 'Old Subtask',
        isDone: false,
      });
      subtaskRepo.isSubtaskInTask.mockResolvedValue(true);
      subtaskRepo.updateSubtask.mockResolvedValue(mockSubtask);
      activityRepo.log.mockResolvedValue(undefined);

      const result = await taskService.updateSubtask(
        'project-123',
        'task-123',
        'subtask-123',
        'user-123',
        {
          title: 'Updated Subtask',
          isDone: true,
        }
      );

      expect(result).toEqual(mockSubtask);
      expect(activityRepo.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenError for non-modifier', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(false);

      await expect(
        taskService.updateSubtask('project-123', 'task-123', 'subtask-123', 'viewer', {
          title: 'New',
        })
      ).rejects.toThrow('You do not have permission to update subtasks');
    });

    it('should throw NotFoundError for non-existent subtask', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(true);
      subtaskRepo.findSubtaskById.mockResolvedValue(null);

      await expect(
        taskService.updateSubtask('project-123', 'task-123', 'non-existent', 'user-123', {
          title: 'New',
        })
      ).rejects.toThrow('Subtask not found');
    });

    it('should throw NotFoundError for subtask in different task', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(true);
      subtaskRepo.findSubtaskById.mockResolvedValue({
        id: 'subtask-123',
        taskId: 'other-task',
      });
      subtaskRepo.isSubtaskInTask.mockResolvedValue(false);

      await expect(
        taskService.updateSubtask('project-123', 'task-123', 'subtask-123', 'user-123', {
          title: 'New',
        })
      ).rejects.toThrow('Subtask not found');
    });
  });

  describe('deleteSubtask', () => {
    it('should delete subtask as modifier', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(true);
      subtaskRepo.findSubtaskById.mockResolvedValue({
        id: 'subtask-123',
        taskId: 'task-123',
        title: 'Deleted Subtask',
      });
      subtaskRepo.isSubtaskInTask.mockResolvedValue(true);
      subtaskRepo.deleteSubtask.mockResolvedValue(undefined);
      activityRepo.log.mockResolvedValue(undefined);

      await taskService.deleteSubtask('project-123', 'task-123', 'subtask-123', 'user-123');

      expect(subtaskRepo.deleteSubtask).toHaveBeenCalled();
      expect(activityRepo.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenError for non-modifier', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(false);

      await expect(
        taskService.deleteSubtask('project-123', 'task-123', 'subtask-123', 'viewer')
      ).rejects.toThrow('You do not have permission to delete subtasks');
    });

    it('should throw NotFoundError for non-existent subtask', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(true);
      subtaskRepo.findSubtaskById.mockResolvedValue(null);

      await expect(
        taskService.deleteSubtask('project-123', 'task-123', 'non-existent', 'user-123')
      ).rejects.toThrow('Subtask not found');
    });
  });

  describe('addAssignee', () => {
    it('should add assignee as member', async () => {
      const mockAssignee = {
        taskId: 'task-123',
        userId: 'assignee-123',
      };

      projectRepo.getMemberRole.mockResolvedValue('MEMBER');
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'project-123',
      });
      projectRepo.isProjectMember.mockResolvedValue(true);
      assigneeRepo.isUserAssigned.mockResolvedValue(false);
      assigneeRepo.addAssignee.mockResolvedValue(mockAssignee);
      activityRepo.log.mockResolvedValue(undefined);

      const result = await taskService.addAssignee(
        'project-123',
        'task-123',
        'member-123',
        'assignee-123'
      );

      expect(result).toEqual(mockAssignee);
      expect(activityRepo.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenError for viewer', async () => {
      projectRepo.getMemberRole.mockResolvedValue('VIEWER');

      await expect(
        taskService.addAssignee('project-123', 'task-123', 'viewer', 'assignee-123')
      ).rejects.toThrow('Only members can assign users');
    });

    it('should throw ForbiddenError for non-member assignee', async () => {
      projectRepo.getMemberRole.mockResolvedValue('MEMBER');
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'project-123',
      });
      projectRepo.isProjectMember.mockResolvedValue(false);

      await expect(
        taskService.addAssignee('project-123', 'task-123', 'member-123', 'non-member')
      ).rejects.toThrow('User is not a member of this project');
    });

    it('should throw ForbiddenError for already assigned user', async () => {
      projectRepo.getMemberRole.mockResolvedValue('MEMBER');
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'project-123',
      });
      projectRepo.isProjectMember.mockResolvedValue(true);
      assigneeRepo.isUserAssigned.mockResolvedValue(true);

      await expect(
        taskService.addAssignee('project-123', 'task-123', 'member-123', 'assignee-123')
      ).rejects.toThrow('User is already assigned to this task');
    });

    it('should throw NotFoundError for task in different project', async () => {
      projectRepo.getMemberRole.mockResolvedValue('MEMBER');
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'other-project',
      });

      await expect(
        taskService.addAssignee('project-123', 'task-123', 'member-123', 'assignee-123')
      ).rejects.toThrow('Task not found');
    });
  });

  describe('removeAssignee', () => {
    it('should remove assignee as modifier', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'project-123',
      });
      assigneeRepo.removeAssignee.mockResolvedValue(undefined);
      activityRepo.log.mockResolvedValue(undefined);

      await taskService.removeAssignee('project-123', 'task-123', 'user-123', 'assignee-123');

      expect(assigneeRepo.removeAssignee).toHaveBeenCalled();
      expect(activityRepo.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenError for non-modifier', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(false);

      await expect(
        taskService.removeAssignee('project-123', 'task-123', 'viewer', 'assignee-123')
      ).rejects.toThrow('You do not have permission to remove assignees');
    });

    it('should throw NotFoundError for task in different project', async () => {
      taskRepo.canUserModifyTask.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'other-project',
      });

      await expect(
        taskService.removeAssignee('project-123', 'task-123', 'user-123', 'assignee-123')
      ).rejects.toThrow('Task not found');
    });
  });

  describe('findAssignees', () => {
    it('should return assignees for project member', async () => {
      const mockAssignees = [
        { userId: 'user-1', taskId: 'task-123' },
        { userId: 'user-2', taskId: 'task-123' },
      ];

      projectRepo.isProjectMember.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'project-123',
      });
      assigneeRepo.findAssigneesByTask.mockResolvedValue(mockAssignees);

      const result = await taskService.findAssignees('project-123', 'task-123', 'user-123');

      expect(result).toHaveLength(2);
    });

    it('should throw ForbiddenError for non-member', async () => {
      projectRepo.isProjectMember.mockResolvedValue(false);

      await expect(
        taskService.findAssignees('project-123', 'task-123', 'non-member')
      ).rejects.toThrow('You are not a member of this project');
    });

    it('should throw NotFoundError for task in different project', async () => {
      projectRepo.isProjectMember.mockResolvedValue(true);
      taskRepo.findTaskById.mockResolvedValue({
        id: 'task-123',
        projectId: 'other-project',
      });

      await expect(
        taskService.findAssignees('project-123', 'task-123', 'user-123')
      ).rejects.toThrow('Task not found');
    });
  });
});
