import { Router } from 'express';
import {
  createProposal,
  generateProposal,
  getUserProposals,
  getProposalById,
  updateProposal,
  refineSection,
  updateProposalStatus,
  withdrawProposal,
  deleteProposal,
  exportProposalDocx,
  exportProposalPdf
} from '../controllers/proposal.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create new proposal directly
router.post('/', createProposal);

// Generate new proposal from RFP
router.post('/generate', generateProposal);

// Get all user's proposals
router.get('/', getUserProposals);

// Get specific proposal
router.get('/:id', getProposalById);

// Update proposal content
router.put('/:id', updateProposal);

// Refine section with AI
router.post('/:id/refine', refineSection);

// Update proposal status
router.put('/:id/status', updateProposalStatus);

// Withdraw proposal (convenience endpoint)
router.put('/:id/withdraw', withdrawProposal);

// Delete proposal
router.delete('/:id', deleteProposal);

// Export proposal as DOCX
router.get('/:id/export/docx', exportProposalDocx);

// Export proposal as PDF
router.get('/:id/export/pdf', exportProposalPdf);

export default router;
