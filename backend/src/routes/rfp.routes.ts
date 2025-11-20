import { Router } from 'express';
import {
  uploadAndParseRFP,
  getUserRFPs,
  getRFPById,
  reparseRFP,
  deleteRFP,
  downloadRFP
} from '../controllers/rfp.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

/**
 * All RFP routes require authentication
 */

// GET /api/rfp - Get all user's RFPs
router.get('/', authenticate, getUserRFPs);

// POST /api/rfp/upload - Upload and parse RFP
router.post('/upload', authenticate, upload.single('file'), uploadAndParseRFP);

// GET /api/rfp/:id - Get RFP by ID
router.get('/:id', authenticate, getRFPById);

// POST /api/rfp/:id/reparse - Re-parse existing RFP
router.post('/:id/reparse', authenticate, reparseRFP);

// GET /api/rfp/:id/download - Download original RFP file
router.get('/:id/download', authenticate, downloadRFP);

// DELETE /api/rfp/:id - Delete RFP
router.delete('/:id', authenticate, deleteRFP);

export default router;
