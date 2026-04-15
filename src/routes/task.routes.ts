import { Router, type Router as ExpressRouter } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as taskController from '../controllers/task.controller.js';

const router: ExpressRouter = Router();

// All routes require authentication
router.use(authenticate);

// Tasks CRUD
router.post('/projects/:projectId/tasks', taskController.create);
router.get('/projects/:projectId/tasks', taskController.findAll);
router.get('/projects/:projectId/tasks/:taskId', taskController.findOne);
router.patch('/projects/:projectId/tasks/:taskId', taskController.update);
router.delete('/projects/:projectId/tasks/:taskId', taskController.remove);
router.post('/projects/:projectId/tasks/:taskId/restore', taskController.restore);

// Subtasks
router.get('/projects/:projectId/tasks/:taskId/subtasks', taskController.findSubtasks);
router.post('/projects/:projectId/tasks/:taskId/subtasks', taskController.createSubtask);
router.patch(
  '/projects/:projectId/tasks/:taskId/subtasks/:subtaskId',
  taskController.updateSubtask
);
router.delete(
  '/projects/:projectId/tasks/:taskId/subtasks/:subtaskId',
  taskController.deleteSubtask
);

// Assignees
router.get('/projects/:projectId/tasks/:taskId/assignees', taskController.findAssignees);
router.post('/projects/:projectId/tasks/:taskId/assignees', taskController.addAssignee);
router.delete(
  '/projects/:projectId/tasks/:taskId/assignees/:assigneeId',
  taskController.removeAssignee
);

export default router;
