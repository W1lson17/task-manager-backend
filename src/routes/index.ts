import { Router, type Router as ExpressRouter } from 'express';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';
import taskRoutes from './task.routes.js';
import commentRoutes from './comment.routes.js';

const router: ExpressRouter = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/projects', taskRoutes);
router.use('/projects', commentRoutes);

export default router;
