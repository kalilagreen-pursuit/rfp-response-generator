import { Router } from 'express';
import { proxyVideo } from '../controllers/video.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Proxy video request with server-side API key
router.get('/proxy', apiLimiter, proxyVideo);

export default router;

