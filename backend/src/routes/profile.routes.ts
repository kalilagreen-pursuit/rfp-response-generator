import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  deleteProfile,
  getMarketplaceProfiles,
  getProfileById
} from '../controllers/profile.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Public routes
 */

// GET /api/profile/marketplace - Get public profiles
router.get('/marketplace', optionalAuthenticate, getMarketplaceProfiles);

// GET /api/profile/:id - Get profile by ID (public only)
router.get('/:id', getProfileById);

/**
 * Protected routes (authentication required)
 */

// GET /api/profile - Get current user's profile
router.get('/', authenticate, getProfile);

// PUT /api/profile - Update current user's profile
router.put('/', authenticate, updateProfile);

// DELETE /api/profile - Delete current user's profile
router.delete('/', authenticate, deleteProfile);

export default router;
