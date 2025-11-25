import { Router } from 'express';
import {
  inviteTeamMember,
  getProposalTeam,
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
  removeTeamMember
} from '../controllers/team.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * All team routes require authentication
 */

// POST /api/team/invite - Invite a team member to a proposal
router.post('/invite', authenticate, inviteTeamMember);

// GET /api/team/proposal/:proposalId - Get team members for a proposal
router.get('/proposal/:proposalId', authenticate, getProposalTeam);

// GET /api/team/invitations - Get invitations for authenticated user
router.get('/invitations', authenticate, getMyInvitations);

// POST /api/team/invitations/:id/accept - Accept an invitation
router.post('/invitations/:id/accept', authenticate, acceptInvitation);

// POST /api/team/invitations/:id/decline - Decline an invitation
router.post('/invitations/:id/decline', authenticate, declineInvitation);

// DELETE /api/team/proposal/:proposalId/member/:memberId - Remove team member
router.delete('/proposal/:proposalId/member/:memberId', authenticate, removeTeamMember);

export default router;
