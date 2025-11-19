import { Router } from 'express';
import {
  uploadDocument,
  uploadMultipleDocuments,
  getUserDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument,
  getDocumentStats
} from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload, uploadMultiple } from '../middleware/upload.middleware.js';

const router = Router();

/**
 * All document routes require authentication
 */

// GET /api/documents/stats - Get document statistics
router.get('/stats', authenticate, getDocumentStats);

// GET /api/documents - Get all user documents
router.get('/', authenticate, getUserDocuments);

// POST /api/documents/upload - Upload single document
router.post('/upload', authenticate, upload.single('file'), uploadDocument);

// POST /api/documents/upload-multiple - Upload multiple documents
router.post('/upload-multiple', authenticate, uploadMultiple.array('files', 10), uploadMultipleDocuments);

// GET /api/documents/:id - Get document by ID
router.get('/:id', authenticate, getDocumentById);

// GET /api/documents/:id/download - Download document
router.get('/:id/download', authenticate, downloadDocument);

// DELETE /api/documents/:id - Delete document
router.delete('/:id', authenticate, deleteDocument);

export default router;
