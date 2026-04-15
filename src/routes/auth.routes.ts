import { Router, type Router as ExpressRouter } from 'express';
import { validate, authRateLimiter, authenticate } from '../middlewares/index.js';
import { signupSchema, loginSchema } from '../schemas/auth.schema.js';
import {
  register,
  loginUser,
  logoutUser,
  logoutAllSessions,
  me,
  refreshAccessTokens,
} from '../controllers/auth.controller.js';

const router: ExpressRouter = Router();

// POST /auth/signup
router.post('/signup', authRateLimiter, validate(signupSchema), register);

// POST /auth/login
router.post('/login', authRateLimiter, validate(loginSchema), loginUser);

// POST /auth/refresh
router.post('/refresh', validate(loginSchema), refreshAccessTokens);

// POST /auth/logout
router.post('/logout', authenticate, logoutUser);

// POST /auth/logout-all
router.post('/logout-all', authenticate, logoutAllSessions);

// GET /auth/me
router.get('/me', authenticate, me);

export default router;
