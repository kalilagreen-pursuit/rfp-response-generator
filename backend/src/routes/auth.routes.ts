import { Router } from 'express';
import {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';
import { authenticate, validateFields } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * Public routes (no authentication required)
 */

// POST /api/auth/register - Register new user
router.post('/register', authLimiter, validateFields(['email', 'password']), register);

// POST /api/auth/login - Login user
router.post('/login', authLimiter, validateFields(['email', 'password']), login);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', authLimiter, validateFields(['refresh_token']), refreshToken);

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', authLimiter, validateFields(['email']), forgotPassword);

/**
 * Protected routes (authentication required)
 */

// GET /api/auth/me - Get current user
router.get('/me', authenticate, getCurrentUser);

// POST /api/auth/logout - Logout user
router.post('/logout', authenticate, logout);

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', authenticate, validateFields(['password']), resetPassword);

export default router;
