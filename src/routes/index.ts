import { Router, type Router as ExpressRouter } from 'express';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';

const router: ExpressRouter = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);

export default router;
