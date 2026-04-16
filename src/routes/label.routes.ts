import { Router, type Router as ExpressRouter } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as labelController from '../controllers/label.controller.js';

const router: ExpressRouter = Router();

// All routes require authentication
router.use(authenticate);

// Project labels
router.get('/:projectId/labels', labelController.findAll);
router.post('/:projectId/labels', labelController.create);
router.get('/:projectId/labels/:labelId', labelController.findOne);
router.patch('/:projectId/labels/:labelId', labelController.update);
router.delete('/:projectId/labels/:labelId', labelController.remove);

// Task labels
router.get('/:projectId/tasks/:taskId/labels', labelController.findLabels);
router.post('/:projectId/tasks/:taskId/labels', labelController.addLabel);
router.delete('/:projectId/tasks/:taskId/labels/:labelId', labelController.removeLabel);

export default router;
