import { Router, type Router as ExpressRouter } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as taskController from '../controllers/task.controller.js';

const router: ExpressRouter = Router();

// All routes require authentication
router.use(authenticate);

// Tasks CRUD
router.post('/:projectId/tasks', taskController.create);
router.get('/:projectId/tasks', taskController.findAll);
router.get('/:projectId/tasks/:taskId', taskController.findOne);
router.patch('/:projectId/tasks/:taskId', taskController.update);
router.delete('/:projectId/tasks/:taskId', taskController.remove);
router.post('/:projectId/tasks/:taskId/restore', taskController.restore);

// Subtasks
router.get('/:projectId/tasks/:taskId/subtasks', taskController.findSubtasks);
router.post('/:projectId/tasks/:taskId/subtasks', taskController.createSubtask);
router.patch('/:projectId/tasks/:taskId/subtasks/:subtaskId', taskController.updateSubtask);
router.delete('/:projectId/tasks/:taskId/subtasks/:subtaskId', taskController.deleteSubtask);

// Assignees
router.get('/:projectId/tasks/:taskId/assignees', taskController.findAssignees);
router.post('/:projectId/tasks/:taskId/assignees', taskController.addAssignee);
router.delete('/:projectId/tasks/:taskId/assignees/:assigneeId', taskController.removeAssignee);

export default router;
