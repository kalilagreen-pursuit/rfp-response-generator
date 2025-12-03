import { Request, Response } from 'express';
import { supabase } from '../utils/supabase.js';
import crypto from 'crypto';
import {
  sendInvitationEmail,
  sendAcceptanceNotification,
  sendDeclineNotification
} from '../services/email.service.js';

/**
 * Invite a team member to a proposal
 * POST /api/team/invite
 */
export const inviteTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const {
      proposalId,
      memberEmail,
      role,
      rateRange,
      message
    } = req.body;

    // Validation
    if (!proposalId || !memberEmail || !role) {
      res.status(400).json({
        error: 'Missing required fields',
        message: 'Proposal ID, member email, and role are required'
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(memberEmail)) {
      res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
      return;
    }

    // Verify proposal exists and user owns it
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id, title, user_id')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      res.status(404).json({
        error: 'Proposal not found',
        message: 'Proposal not found or access denied'
      });
      return;
    }

    if (proposal.user_id !== req.userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to invite team members to this proposal'
      });
      return;
    }

    // Check if invitation already exists
    const { data: existingInvite, error: existingError } = await supabase
      .from('proposal_team')
      .select('id, status')
      .eq('proposal_id', proposalId)
      .eq('member_email', memberEmail)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid error when no record exists

    // If there's an error other than "not found", log it
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing invitation:', existingError);
    }

    if (existingInvite) {
      if (existingInvite.status === 'invited') {
        res.status(409).json({
          error: 'Invitation exists',
          message: 'An invitation has already been sent to this email for this proposal'
        });
        return;
      } else if (existingInvite.status === 'accepted') {
        res.status(409).json({
          error: 'Already on team',
          message: 'This person has already accepted an invitation to this proposal'
        });
        return;
      }
      // If declined, we can allow re-invitation by updating the existing record
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');

    // Create or update invitation
    let teamMember;
    if (existingInvite && existingInvite.status === 'declined') {
      // Update existing declined invitation
      const updateData: any = {
        role,
        rate_range: rateRange || null,
        status: 'invited',
        invited_at: new Date().toISOString(),
        responded_at: null,
      };
      
      // Try to include invitation_token
      try {
        updateData.invitation_token = invitationToken;
      } catch (e) {
        console.warn('Could not set invitation_token - column may not exist');
      }

      const { data, error: updateError } = await supabase
        .from('proposal_team')
        .update(updateData)
        .eq('id', existingInvite.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update invitation error:', updateError);
        if (updateError.message?.includes('invitation_token') || updateError.code === '42703') {
          throw new Error('Database migration required: Please run supabase_add_invitation_token.sql to add the invitation_token column');
        }
        throw updateError;
      }
      teamMember = data;
    } else {
      // Create new invitation
      // Build insert object - only include invitation_token if column exists
      const insertData: any = {
        proposal_id: proposalId,
        member_email: memberEmail,
        role,
        rate_range: rateRange || null,
        status: 'invited',
      };
      
      // Try to include invitation_token - if column doesn't exist, this will be ignored
      // The migration should add this column, but we'll handle gracefully if it hasn't been run
      try {
        insertData.invitation_token = invitationToken;
      } catch (e) {
        console.warn('Could not set invitation_token - column may not exist. Run migration: supabase_add_invitation_token.sql');
      }

      const { data, error: insertError } = await supabase
        .from('proposal_team')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert invitation error:', insertError);
        // If error is about invitation_token column, provide helpful message
        if (insertError.message?.includes('invitation_token') || insertError.code === '42703') {
          throw new Error('Database migration required: Please run supabase_add_invitation_token.sql to add the invitation_token column');
        }
        throw insertError;
      }
      teamMember = data;
    }

    // Send invitation email
    const invitationLink = `${process.env.FRONTEND_URL}/invitations/accept?token=${invitationToken}`;

    // Get sender's profile for email personalization
    const { data: senderProfile } = await supabase
      .from('company_profiles')
      .select('company_name')
      .eq('user_id', req.userId)
      .single();

    // Send the invitation email
    const emailResult = await sendInvitationEmail({
      recipientEmail: memberEmail,
      recipientRole: role,
      proposalTitle: proposal.title,
      inviterCompanyName: senderProfile?.company_name || 'A company',
      invitationLink,
      personalMessage: message,
      rateRange: rateRange
    });

    if (!emailResult.success) {
      console.warn('Failed to send invitation email:', emailResult.error);
      // Continue even if email fails - the invitation is still created
    }

    res.status(201).json({
      message: 'Team member invited successfully',
      invitation: {
        id: teamMember.id,
        proposalId: teamMember.proposal_id,
        memberEmail: teamMember.member_email,
        role: teamMember.role,
        status: teamMember.status,
        invitedAt: teamMember.invited_at,
        invitationLink, // In development, return link; in production, send via email
        proposalTitle: proposal.title,
        inviterCompany: senderProfile?.company_name || 'A company',
        emailSent: emailResult.success
      }
    });
  } catch (error) {
    console.error('Invite team member error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const requestData = {
      proposalId: req.body?.proposalId,
      memberEmail: req.body?.memberEmail
    };
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      requestData
    });
    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage
    });
  }
};

/**
 * Get team members for a proposal
 * GET /api/team/proposal/:proposalId
 */
export const getProposalTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { proposalId } = req.params;

    // Verify user has access to this proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id, user_id')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      res.status(404).json({
        error: 'Proposal not found',
        message: 'Proposal not found or access denied'
      });
      return;
    }

    // User must own the proposal OR be invited to it
    const isOwner = proposal.user_id === req.userId;

    if (!isOwner) {
      // Check if user is invited
      const { data: userProfile } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', req.userId)
        .single();

      const { data: invitation } = await supabase
        .from('proposal_team')
        .select('id')
        .eq('proposal_id', proposalId)
        .eq('member_profile_id', userProfile?.id)
        .single();

      if (!invitation) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this proposal team'
        });
        return;
      }
    }

    // Get team members
    const { data: teamMembers, error: teamError } = await supabase
      .from('proposal_team')
      .select(`
        id,
        member_email,
        role,
        rate_range,
        status,
        invited_at,
        responded_at,
        company_profiles:member_profile_id (
          id,
          company_name,
          contact_info
        )
      `)
      .eq('proposal_id', proposalId)
      .order('invited_at', { ascending: false });

    if (teamError) throw teamError;

    res.json({
      proposalId,
      teamMembers: teamMembers || []
    });
  } catch (error) {
    console.error('Get proposal team error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get invitation by token (public endpoint for email links)
 * GET /api/team/invitations/token/:token
 */
export const getInvitationByToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({
        error: 'Missing token',
        message: 'Invitation token is required'
      });
      return;
    }

    // Get invitation by token
    const { data: invitation, error: inviteError } = await supabase
      .from('proposal_team')
      .select(`
        id,
        proposal_id,
        member_email,
        role,
        rate_range,
        status,
        invited_at,
        responded_at,
        proposals!proposal_team_proposal_id_fkey (
          id,
          title,
          user_id,
          company_profiles:user_id (
            company_name
          )
        )
      `)
      .eq('invitation_token', token)
      .single();

    if (inviteError || !invitation) {
      res.status(404).json({
        error: 'Invitation not found',
        message: 'Invalid or expired invitation token'
      });
      return;
    }

    // Check if already responded
    if (invitation.status !== 'invited') {
      res.status(400).json({
        error: 'Already responded',
        message: `This invitation has already been ${invitation.status}`,
        invitation: {
          id: invitation.id,
          status: invitation.status,
          respondedAt: invitation.responded_at
        }
      });
      return;
    }

    // Get inviter company name
    const inviterCompany = (invitation.proposals as any)?.company_profiles?.company_name || 'A company';

    res.json({
      invitation: {
        id: invitation.id,
        proposalId: invitation.proposal_id,
        proposalTitle: (invitation.proposals as any)?.title,
        memberEmail: invitation.member_email,
        role: invitation.role,
        rateRange: invitation.rate_range,
        invitedAt: invitation.invited_at,
        inviterCompany
      }
    });
  } catch (error) {
    console.error('Get invitation by token error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get invitations for the authenticated user
 * GET /api/team/invitations
 */
export const getMyInvitations = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    // Get user's email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      req.userId
    );

    if (userError || !userData.user?.email) {
      res.status(404).json({
        error: 'User not found',
        message: 'Could not retrieve user information'
      });
      return;
    }

    const userEmail = userData.user.email;

    // Get invitations sent to this email
    const { data: invitations, error: invitationsError } = await supabase
      .from('proposal_team')
      .select(`
        id,
        proposal_id,
        member_email,
        role,
        rate_range,
        status,
        invited_at,
        responded_at,
        proposals!proposal_team_proposal_id_fkey (
          id,
          title,
          status,
          user_id,
          company_profiles:user_id (
            company_name
          )
        )
      `)
      .eq('member_email', userEmail)
      .order('invited_at', { ascending: false });

    if (invitationsError) throw invitationsError;

    res.json({
      invitations: invitations || []
    });
  } catch (error) {
    console.error('Get my invitations error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Accept an invitation
 * POST /api/team/invitations/:id/accept
 */
export const acceptInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { id } = req.params;
    const { token } = req.body;

    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('proposal_team')
      .select('*')
      .eq('id', id)
      .single();

    if (inviteError || !invitation) {
      res.status(404).json({
        error: 'Invitation not found',
        message: 'Invitation not found'
      });
      return;
    }

    // Verify token if provided (for email link access)
    if (token && invitation.invitation_token !== token) {
      res.status(403).json({
        error: 'Invalid token',
        message: 'Invalid invitation token'
      });
      return;
    }

    // Get user's email
    const { data: userData } = await supabase.auth.admin.getUserById(req.userId);
    const userEmail = userData.user?.email;

    // Verify invitation is for this user
    if (invitation.member_email !== userEmail) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'This invitation is not for your email address'
      });
      return;
    }

    // Check if already responded
    if (invitation.status !== 'invited') {
      res.status(400).json({
        error: 'Already responded',
        message: `You have already ${invitation.status} this invitation`
      });
      return;
    }

    // Get user's profile
    const { data: userProfile } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', req.userId)
      .single();

    // Update invitation
    const { data: updatedInvitation, error: updateError } = await supabase
      .from('proposal_team')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
        member_profile_id: userProfile?.id || null
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Send acceptance notification email to proposal owner
    try {
      // Get proposal details
      const { data: proposal } = await supabase
        .from('proposals')
        .select('user_id, title')
        .eq('id', invitation.proposal_id)
        .single();

      if (proposal) {
        // Get owner's email
        const { data: ownerData } = await supabase.auth.admin.getUserById(proposal.user_id);

        if (ownerData.user?.email) {
          await sendAcceptanceNotification({
            recipientEmail: ownerData.user.email,
            memberEmail: invitation.member_email,
            memberRole: invitation.role,
            proposalTitle: proposal.title
          });
        }
      }
    } catch (emailError) {
      // Log error but don't fail the request
      console.error('Failed to send acceptance notification:', emailError);
    }

    res.json({
      message: 'Invitation accepted successfully',
      invitation: updatedInvitation
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Decline an invitation
 * POST /api/team/invitations/:id/decline
 */
export const declineInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { id } = req.params;

    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('proposal_team')
      .select('*')
      .eq('id', id)
      .single();

    if (inviteError || !invitation) {
      res.status(404).json({
        error: 'Invitation not found',
        message: 'Invitation not found'
      });
      return;
    }

    // Get user's email
    const { data: userData } = await supabase.auth.admin.getUserById(req.userId);
    const userEmail = userData.user?.email;

    // Verify invitation is for this user
    if (invitation.member_email !== userEmail) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'This invitation is not for your email address'
      });
      return;
    }

    // Check if already responded
    if (invitation.status !== 'invited') {
      res.status(400).json({
        error: 'Already responded',
        message: `You have already ${invitation.status} this invitation`
      });
      return;
    }

    // Update invitation
    const { data: updatedInvitation, error: updateError } = await supabase
      .from('proposal_team')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Send decline notification email to proposal owner
    try {
      // Get proposal details
      const { data: proposal } = await supabase
        .from('proposals')
        .select('user_id, title')
        .eq('id', invitation.proposal_id)
        .single();

      if (proposal) {
        // Get owner's email
        const { data: ownerData } = await supabase.auth.admin.getUserById(proposal.user_id);

        if (ownerData.user?.email) {
          await sendDeclineNotification({
            recipientEmail: ownerData.user.email,
            memberEmail: invitation.member_email,
            memberRole: invitation.role,
            proposalTitle: proposal.title
          });
        }
      }
    } catch (emailError) {
      // Log error but don't fail the request
      console.error('Failed to send decline notification:', emailError);
    }

    res.json({
      message: 'Invitation declined',
      invitation: updatedInvitation
    });
  } catch (error) {
    console.error('Decline invitation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Remove a team member from a proposal (owner only)
 * DELETE /api/team/proposal/:proposalId/member/:memberId
 */
export const removeTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { proposalId, memberId } = req.params;

    // Verify proposal exists and user owns it
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id, user_id')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      res.status(404).json({
        error: 'Proposal not found',
        message: 'Proposal not found or access denied'
      });
      return;
    }

    if (proposal.user_id !== req.userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only the proposal owner can remove team members'
      });
      return;
    }

    // Delete team member
    const { error: deleteError } = await supabase
      .from('proposal_team')
      .delete()
      .eq('id', memberId)
      .eq('proposal_id', proposalId);

    if (deleteError) throw deleteError;

    res.json({
      message: 'Team member removed successfully'
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
