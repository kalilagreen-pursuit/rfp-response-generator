import { Router } from 'express';
import {
  createQRCode,
  listQRCodes,
  getQRCodeDetails,
  updateQRCode,
  deleteQRCode,
  getQRCodeLeads,
} from '../controllers/qr.controller.js';
import {
  getLeadCaptureInfo,
  submitLead,
} from '../controllers/lead-capture.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// QR Code Management Routes (Authenticated)
router.post('/qr-codes', authenticate, createQRCode);
router.get('/qr-codes', authenticate, listQRCodes);
router.get('/qr-codes/:id', authenticate, getQRCodeDetails);
router.patch('/qr-codes/:id', authenticate, updateQRCode);
router.delete('/qr-codes/:id', authenticate, deleteQRCode);
router.get('/qr-codes/:id/leads', authenticate, getQRCodeLeads);

// Lead Capture Routes (Public)
router.get('/lead-capture/:uniqueCode', getLeadCaptureInfo);
router.post('/lead-capture/:uniqueCode', submitLead);

export default router;
