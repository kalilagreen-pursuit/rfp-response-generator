import express from 'express';
import {
  getProposalTimes,
  getTeamResponses,
  trackStageStart,
  trackStageComplete
} from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { analyticsLimiter, apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All analytics routes require authentication
router.use(authenticate);

// Get proposal time tracking analytics
router.get('/proposal-times', apiLimiter, getProposalTimes);

// Get team response rate analytics
router.get('/team-responses', apiLimiter, getTeamResponses);

// Track a proposal stage start
router.post('/track-stage', analyticsLimiter, trackStageStart);

// Track a proposal stage completion
router.put('/track-stage/:id/complete', analyticsLimiter, trackStageComplete);

export default router;




