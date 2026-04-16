import { Router, type Router as ExpressRouter } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as activityController from '../controllers/activity.controller.js';

const router: ExpressRouter = Router();

// All routes require authentication
router.use(authenticate);

// Activity log
router.get('/:projectId/activities', activityController.getProjectActivities);
router.get('/:projectId/:entityType/:entityId/activities', activityController.getEntityActivities);

export default router;
