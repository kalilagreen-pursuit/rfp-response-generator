import { Router } from 'express';
import {
  inviteTeamMember,
  getProposalTeam,
  getMyInvitations,
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,
  removeTeamMember
} from '../controllers/team.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { invitationLimiter, apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * All team routes require authentication
 */

// POST /api/team/invite - Invite a team member to a proposal
router.post('/invite', authenticate, invitationLimiter, inviteTeamMember);

// GET /api/team/proposal/:proposalId - Get team members for a proposal
router.get('/proposal/:proposalId', authenticate, apiLimiter, getProposalTeam);

// GET /api/team/invitations/token/:token - Get invitation by token (public, for email links)
router.get('/invitations/token/:token', apiLimiter, getInvitationByToken);

// GET /api/team/invitations - Get invitations for authenticated user
router.get('/invitations', authenticate, apiLimiter, getMyInvitations);

// POST /api/team/invitations/:id/accept - Accept an invitation
router.post('/invitations/:id/accept', authenticate, apiLimiter, acceptInvitation);

// POST /api/team/invitations/:id/decline - Decline an invitation
router.post('/invitations/:id/decline', authenticate, apiLimiter, declineInvitation);

// DELETE /api/team/proposal/:proposalId/member/:memberId - Remove team member
router.delete('/proposal/:proposalId/member/:memberId', authenticate, apiLimiter, removeTeamMember);

export default router;
