import { Router, type Router as ExpressRouter } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as commentController from '../controllers/comment.controller.js';

const router: ExpressRouter = Router();

// All routes require authentication
router.use(authenticate);

// Comments nested under tasks
router.get('/:taskId/comments', commentController.findAll);
router.post('/:taskId/comments', commentController.create);
router.get('/comments/:commentId', commentController.findOne);
router.patch('/comments/:commentId', commentController.update);
router.delete('/comments/:commentId', commentController.remove);

export default router;
