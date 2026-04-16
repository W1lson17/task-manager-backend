import { vi, beforeEach } from 'vitest';

// Hoisted mocks - these are defined before any imports
const { prismaMock, helpersMock, projectRepoMock, taskRepoMock } = vi.hoisted(() => {
  const prismaMock = {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    project: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    task: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    comment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    label: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    projectMember: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    subtask: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    taskAssignee: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    taskLabel: {
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
  };

  const helpersMock = {
    comparePassword: vi.fn(),
    hashPassword: vi.fn(),
    signAccessToken: vi.fn(),
    signRefreshToken: vi.fn(),
    verifyToken: vi.fn(),
  };

  const projectRepoMock = {
    createProject: vi.fn(),
    findProjectById: vi.fn(),
    isProjectMember: vi.fn(),
    isProjectOwner: vi.fn(),
    getMemberRole: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
  };

  const taskRepoMock = {
    createTask: vi.fn(),
    findTaskById: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    canUserModifyTask: vi.fn(),
  };

  return { prismaMock, helpersMock, projectRepoMock, taskRepoMock };
});

// Mock Prisma
vi.mock('../config/database', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

// Mock helpers
vi.mock('../helpers/index', () => ({
  ...helpersMock,
  default: helpersMock,
}));

// Mock repositories
vi.mock('../repositories/project.repository', () => ({
  ...projectRepoMock,
  default: projectRepoMock,
}));

vi.mock('../repositories/task.repository', () => ({
  ...taskRepoMock,
  default: taskRepoMock,
}));

// Export mocks for use in tests
export { prismaMock, helpersMock, projectRepoMock, taskRepoMock };

// Reset all mocks after each test
beforeEach(() => {
  vi.clearAllMocks();
});
