import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from './setup';

// Mock repositories
vi.mock('../repositories/project.repository', () => ({
  createProject: vi.fn(),
  findProjectById: vi.fn(),
  findProjectBySlug: vi.fn(),
  findProjectsByUser: vi.fn(),
  isProjectMember: vi.fn(),
  isProjectOwner: vi.fn(),
  getMemberRole: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  restoreProject: vi.fn(),
  default: {
    createProject: vi.fn(),
    findProjectById: vi.fn(),
    findProjectBySlug: vi.fn(),
    findProjectsByUser: vi.fn(),
    isProjectMember: vi.fn(),
    isProjectOwner: vi.fn(),
    getMemberRole: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    restoreProject: vi.fn(),
  },
}));

vi.mock('../repositories/member.repository', () => ({
  findMemberByEmail: vi.fn(),
  addMember: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
  default: {
    findMemberByEmail: vi.fn(),
    addMember: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
  },
}));

vi.mock('../repositories/activity.repository', () => ({
  log: vi.fn(),
  default: {
    log: vi.fn(),
  },
}));

// Import after mocks
import * as projectService from '../services/project.service';
import * as projectRepo from '../repositories/project.repository';
import * as memberRepo from '../repositories/member.repository';
import * as activityRepo from '../repositories/activity.repository';

describe('Project Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a project and log activity', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'My Project',
        description: 'A test project',
        slug: 'my-project',
        color: '#3B82F6',
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      projectRepo.createProject.mockResolvedValue(mockProject);
      activityRepo.log.mockResolvedValue(undefined);

      const result = await projectService.create('user-123', {
        name: 'My Project',
        description: 'A test project',
      });

      expect(result).toEqual(mockProject);
      expect(projectRepo.createProject).toHaveBeenCalledWith({
        name: 'My Project',
        description: 'A test project',
        ownerId: 'user-123',
      });
      expect(activityRepo.log).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated projects', async () => {
      const mockResult = {
        projects: [{ id: 'project-1' }, { id: 'project-2' }],
        total: 2,
        page: 1,
        totalPages: 1,
      };

      projectRepo.findProjectsByUser.mockResolvedValue(mockResult);

      const result = await projectService.findAll('user-123', 1, 10);

      expect(result.projects).toHaveLength(2);
      expect(projectRepo.findProjectsByUser).toHaveBeenCalledWith('user-123', 1, 10, undefined);
    });

    it('should pass search filter', async () => {
      projectRepo.findProjectsByUser.mockResolvedValue({
        projects: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      await projectService.findAll('user-123', 1, 10, 'search term');

      expect(projectRepo.findProjectsByUser).toHaveBeenCalledWith('user-123', 1, 10, 'search term');
    });
  });

  describe('findOne', () => {
    it('should return project for valid member', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'My Project',
        ownerId: 'user-123',
        deletedAt: null,
      };

      projectRepo.findProjectById.mockResolvedValue(mockProject);
      projectRepo.isProjectMember.mockResolvedValue(true);

      const result = await projectService.findOne('project-123', 'user-123');

      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundError for non-existent project', async () => {
      projectRepo.findProjectById.mockResolvedValue(null);

      await expect(projectService.findOne('non-existent', 'user-123')).rejects.toThrow('Project');
    });

    it('should throw NotFoundError for deleted project', async () => {
      projectRepo.findProjectById.mockResolvedValue({
        id: 'project-123',
        deletedAt: new Date(),
      });

      await expect(projectService.findOne('project-123', 'user-123')).rejects.toThrow('Project');
    });

    it('should throw ForbiddenError for non-member', async () => {
      projectRepo.findProjectById.mockResolvedValue({
        id: 'project-123',
        deletedAt: null,
      });
      projectRepo.isProjectMember.mockResolvedValue(false);

      await expect(projectService.findOne('project-123', 'non-member')).rejects.toThrow(
        'You are not a member of this project'
      );
    });
  });

  describe('findBySlug', () => {
    it('should return project for valid slug', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'My Project',
        slug: 'my-project',
        deletedAt: null,
      };

      projectRepo.findProjectBySlug.mockResolvedValue(mockProject);
      projectRepo.isProjectMember.mockResolvedValue(true);

      const result = await projectService.findBySlug('my-project', 'user-123');

      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundError for non-existent slug', async () => {
      projectRepo.findProjectBySlug.mockResolvedValue(null);

      await expect(projectService.findBySlug('non-existent', 'user-123')).rejects.toThrow(
        'Project'
      );
    });

    it('should throw NotFoundError for deleted project by slug', async () => {
      projectRepo.findProjectBySlug.mockResolvedValue({
        id: 'project-123',
        deletedAt: new Date(),
      });

      await expect(projectService.findBySlug('deleted-project', 'user-123')).rejects.toThrow(
        'Project'
      );
    });

    it('should throw ForbiddenError for non-member', async () => {
      projectRepo.findProjectBySlug.mockResolvedValue({
        id: 'project-123',
        deletedAt: null,
      });
      projectRepo.isProjectMember.mockResolvedValue(false);

      await expect(projectService.findBySlug('my-project', 'non-member')).rejects.toThrow(
        'You are not a member of this project'
      );
    });
  });

  describe('update', () => {
    it('should update project as owner', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Updated Project',
        description: 'Updated description',
      };

      projectRepo.getMemberRole.mockResolvedValue('OWNER');
      projectRepo.findProjectById.mockResolvedValue({
        id: 'project-123',
        name: 'Old Project',
        description: null,
      });
      projectRepo.updateProject.mockResolvedValue(mockProject);
      activityRepo.log.mockResolvedValue(undefined);

      const result = await projectService.update('project-123', 'owner-123', {
        name: 'Updated Project',
        description: 'Updated description',
      });

      expect(result).toEqual(mockProject);
      expect(activityRepo.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenError for non-member', async () => {
      projectRepo.getMemberRole.mockResolvedValue(null);

      await expect(
        projectService.update('project-123', 'non-member', { name: 'New Name' })
      ).rejects.toThrow('You are not a member of this project');
    });

    it('should throw ForbiddenError for viewer', async () => {
      projectRepo.getMemberRole.mockResolvedValue('VIEWER');

      await expect(
        projectService.update('project-123', 'viewer', { name: 'New Name' })
      ).rejects.toThrow('Only owner or admin can update project');
    });

    it('should throw ForbiddenError for member', async () => {
      projectRepo.getMemberRole.mockResolvedValue('MEMBER');

      await expect(
        projectService.update('project-123', 'member', { name: 'New Name' })
      ).rejects.toThrow('Only owner or admin can update project');
    });
  });

  describe('remove', () => {
    it('should soft delete project as owner', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Deleted Project',
      };

      projectRepo.isProjectOwner.mockResolvedValue(true);
      projectRepo.deleteProject.mockResolvedValue(mockProject);
      activityRepo.log.mockResolvedValue(undefined);

      const result = await projectService.remove('project-123', 'owner-123');

      expect(result).toEqual(mockProject);
      expect(activityRepo.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenError for non-owner', async () => {
      projectRepo.isProjectOwner.mockResolvedValue(false);

      await expect(projectService.remove('project-123', 'non-owner')).rejects.toThrow(
        'Only owner can delete project'
      );
    });
  });

  describe('restore', () => {
    it('should restore project as owner', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Restored Project',
      };

      projectRepo.isProjectOwner.mockResolvedValue(true);
      projectRepo.restoreProject.mockResolvedValue(mockProject);
      activityRepo.log.mockResolvedValue(undefined);

      const result = await projectService.restore('project-123', 'owner-123');

      expect(result).toEqual(mockProject);
      expect(activityRepo.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenError for non-owner', async () => {
      projectRepo.isProjectOwner.mockResolvedValue(false);

      await expect(projectService.restore('project-123', 'non-owner')).rejects.toThrow(
        'Only owner can restore project'
      );
    });
  });

  describe('addMemberToProject', () => {
    it('should add member as admin', async () => {
      const mockUser = {
        id: 'new-user',
        email: 'new@example.com',
      };

      const mockMember = {
        id: 'member-123',
        projectId: 'project-123',
        userId: 'new-user',
        role: 'MEMBER',
      };

      projectRepo.getMemberRole.mockResolvedValue('ADMIN');
      memberRepo.findMemberByEmail.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      memberRepo.addMember.mockResolvedValue(mockMember);
      activityRepo.log.mockResolvedValue(undefined);

      const result = await projectService.addMemberToProject('project-123', 'admin-123', {
        email: 'new@example.com',
        role: 'MEMBER',
      });

      expect(result).toEqual(mockMember);
    });

    it('should throw ForbiddenError for non-admin', async () => {
      projectRepo.getMemberRole.mockResolvedValue('MEMBER');

      await expect(
        projectService.addMemberToProject('project-123', 'member-123', {
          email: 'new@example.com',
        })
      ).rejects.toThrow('Only owner or admin can add members');
    });

    it('should throw ConflictError for existing member', async () => {
      projectRepo.getMemberRole.mockResolvedValue('ADMIN');
      memberRepo.findMemberByEmail.mockResolvedValue({
        id: 'existing-member',
      });

      await expect(
        projectService.addMemberToProject('project-123', 'admin-123', {
          email: 'existing@example.com',
        })
      ).rejects.toThrow('User is already a member of this project');
    });

    it('should throw NotFoundError for non-existent user', async () => {
      projectRepo.getMemberRole.mockResolvedValue('ADMIN');
      memberRepo.findMemberByEmail.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        projectService.addMemberToProject('project-123', 'admin-123', {
          email: 'nonexistent@example.com',
        })
      ).rejects.toThrow('User');
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role as owner', async () => {
      const mockMember = {
        id: 'member-123',
        role: 'ADMIN',
      };

      projectRepo.isProjectOwner.mockResolvedValue(true);
      projectRepo.getMemberRole.mockResolvedValue('MEMBER');
      memberRepo.updateMemberRole.mockResolvedValue(mockMember);
      activityRepo.log.mockResolvedValue(undefined);

      const result = await projectService.updateMemberRole(
        'project-123',
        'owner-123',
        'member-123',
        'ADMIN'
      );

      expect(result).toEqual(mockMember);
    });

    it('should throw ForbiddenError for non-owner', async () => {
      projectRepo.isProjectOwner.mockResolvedValue(false);

      await expect(
        projectService.updateMemberRole('project-123', 'non-owner', 'member-123', 'ADMIN')
      ).rejects.toThrow('Only owner can change member roles');
    });

    it('should throw ForbiddenError when trying to change owner role', async () => {
      projectRepo.isProjectOwner.mockResolvedValue(true);
      projectRepo.getMemberRole.mockResolvedValue('OWNER');

      await expect(
        projectService.updateMemberRole('project-123', 'owner-123', 'owner-123', 'ADMIN')
      ).rejects.toThrow('Cannot change owner role');
    });
  });

  describe('removeMemberFromProject', () => {
    it('should remove member as owner', async () => {
      projectRepo.isProjectOwner.mockResolvedValue(true);
      // First call: currentUser role, Second call: targetUser role
      projectRepo.getMemberRole
        .mockResolvedValueOnce('MEMBER') // target user role (not OWNER)
        .mockResolvedValueOnce('MEMBER'); // owner checking target
      memberRepo.removeMember.mockResolvedValue(undefined);
      activityRepo.log.mockResolvedValue(undefined);

      await projectService.removeMemberFromProject('project-123', 'owner-123', 'member-123');

      expect(memberRepo.removeMember).toHaveBeenCalled();
    });

    it('should allow member to remove themselves', async () => {
      projectRepo.isProjectOwner.mockResolvedValue(false);
      // current user role, then target user role (same user)
      projectRepo.getMemberRole
        .mockResolvedValueOnce('MEMBER') // current user role
        .mockResolvedValueOnce('MEMBER'); // target user role (same)
      memberRepo.removeMember.mockResolvedValue(undefined);
      activityRepo.log.mockResolvedValue(undefined);

      await projectService.removeMemberFromProject('project-123', 'member-123', 'member-123');

      expect(memberRepo.removeMember).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when trying to remove owner', async () => {
      projectRepo.isProjectOwner.mockResolvedValue(true);
      // target is OWNER
      projectRepo.getMemberRole.mockResolvedValueOnce('OWNER');

      await expect(
        projectService.removeMemberFromProject('project-123', 'owner-123', 'owner-123')
      ).rejects.toThrow('Cannot remove owner from project');
    });

    it('should throw ForbiddenError for non-authorized removal', async () => {
      projectRepo.isProjectOwner.mockResolvedValue(false);
      projectRepo.getMemberRole
        .mockResolvedValueOnce('MEMBER') // current user role
        .mockResolvedValueOnce('ADMIN'); // target user role (higher than MEMBER)

      await expect(
        projectService.removeMemberFromProject('project-123', 'member-123', 'admin-123')
      ).rejects.toThrow('You cannot remove this member');
    });
  });
});
