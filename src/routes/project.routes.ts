import { Router, type Router as ExpressRouter } from 'express';
import { validate, validateQuery, authenticate } from '../middlewares/index.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  projectQuerySchema,
} from '../schemas/project.schema.js';
import {
  getAll,
  getOne,
  createProject,
  updateProject,
  deleteProject,
  restoreProject,
  addMember,
  updateRole,
  removeMember,
} from '../controllers/project.controller.js';

const router: ExpressRouter = Router();

// All routes require authentication
router.use(authenticate);

// GET /projects - List all user projects
router.get('/', validateQuery(projectQuerySchema), getAll);

// POST /projects - Create a new project
router.post('/', validate(createProjectSchema), createProject);

// GET /projects/:id - Get project by ID
router.get('/:id', getOne);

// PUT /projects/:id - Update project
router.put('/:id', validate(updateProjectSchema), updateProject);

// DELETE /projects/:id - Delete project (soft delete)
router.delete('/:id', deleteProject);

// PATCH /projects/:id/restore - Restore deleted project
router.patch('/:id/restore', restoreProject);

// POST /projects/:id/members - Add member to project
router.post('/:id/members', validate(addMemberSchema), addMember);

// PATCH /projects/:id/members/:userId - Update member role
router.patch('/:id/members/:userId', updateRole);

// DELETE /projects/:id/members/:userId - Remove member from project
router.delete('/:id/members/:userId', removeMember);

export default router;
