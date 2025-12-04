import { Request, Response } from 'express';
import { supabase } from '../utils/supabase.js';

/**
 * Get proposal time tracking analytics
 * GET /api/analytics/proposal-times
 */
export const getProposalTimes = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { proposalId } = req.query;

    let query = supabase
      .from('proposal_time_tracking')
      .select(`
        id,
        proposal_id,
        stage,
        started_at,
        completed_at,
        proposals!proposal_time_tracking_proposal_id_fkey (
          id,
          title,
          user_id
        )
      `);

    // Filter by user's proposals only
    if (proposalId) {
      query = query.eq('proposal_id', proposalId as string);
    }

    const { data: timeTracking, error: trackingError } = await query;

    if (trackingError) throw trackingError;

    // Filter to only show proposals owned by the user
    const userProposals = timeTracking?.filter(
      (track) => (track.proposals as any)?.user_id === req.userId
    ) || [];

    // Calculate time differences
    const analytics = userProposals.map((track) => {
      const started = new Date(track.started_at);
      const completed = track.completed_at ? new Date(track.completed_at) : new Date();
      const durationMs = completed.getTime() - started.getTime();
      const durationMinutes = Math.round(durationMs / 1000 / 60);

      return {
        id: track.id,
        proposalId: track.proposal_id,
        proposalTitle: (track.proposals as any)?.title || 'Unknown',
        stage: track.stage,
        startedAt: track.started_at,
        completedAt: track.completed_at,
        durationMinutes,
        isCompleted: !!track.completed_at
      };
    });

    // Aggregate by stage
    const stageStats = analytics.reduce((acc, item) => {
      if (!acc[item.stage]) {
        acc[item.stage] = {
          stage: item.stage,
          totalCount: 0,
          completedCount: 0,
          totalMinutes: 0,
          averageMinutes: 0
        };
      }
      acc[item.stage].totalCount++;
      if (item.isCompleted) {
        acc[item.stage].completedCount++;
        acc[item.stage].totalMinutes += item.durationMinutes;
      }
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages
    Object.values(stageStats).forEach((stat: any) => {
      if (stat.completedCount > 0) {
        stat.averageMinutes = Math.round(stat.totalMinutes / stat.completedCount);
      }
    });

    res.json({
      analytics: analytics,
      stageStats: Object.values(stageStats),
      summary: {
        totalStages: analytics.length,
        completedStages: analytics.filter(a => a.isCompleted).length,
        averageTimeMinutes: analytics.length > 0
          ? Math.round(analytics.filter(a => a.isCompleted).reduce((sum, a) => sum + a.durationMinutes, 0) / analytics.filter(a => a.isCompleted).length)
          : 0
      }
    });
  } catch (error) {
    console.error('Get proposal times error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get team response rate analytics
 * GET /api/analytics/team-responses
 */
export const getTeamResponses = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    // Get all proposals owned by the user
    const { data: proposals, error: proposalsError } = await supabase
      .from('proposals')
      .select('id, title')
      .eq('user_id', req.userId);

    if (proposalsError) throw proposalsError;

    const proposalIds = proposals?.map(p => p.id) || [];

    if (proposalIds.length === 0) {
      res.json({
        invitations: [],
        stats: {
          totalInvitations: 0,
          accepted: 0,
          declined: 0,
          pending: 0,
          responseRate: 0,
          averageResponseTimeHours: 0
        }
      });
      return;
    }

    // Get all team invitations for user's proposals
    const { data: invitations, error: invitationsError } = await supabase
      .from('proposal_team')
      .select(`
        id,
        proposal_id,
        member_email,
        role,
        status,
        invited_at,
        responded_at,
        proposals!proposal_team_proposal_id_fkey (
          id,
          title
        )
      `)
      .in('proposal_id', proposalIds)
      .order('invited_at', { ascending: false });

    if (invitationsError) throw invitationsError;

    // Calculate response times
    const invitationsWithResponseTime = invitations?.map((inv) => {
      const invitedAt = new Date(inv.invited_at);
      const respondedAt = inv.responded_at ? new Date(inv.responded_at) : null;
      const responseTimeHours = respondedAt
        ? Math.round((respondedAt.getTime() - invitedAt.getTime()) / 1000 / 60 / 60 * 10) / 10
        : null;

      return {
        id: inv.id,
        proposalId: inv.proposal_id,
        proposalTitle: (inv.proposals as any)?.title || 'Unknown',
        memberEmail: inv.member_email,
        role: inv.role,
        status: inv.status,
        invitedAt: inv.invited_at,
        respondedAt: inv.responded_at,
        responseTimeHours
      };
    }) || [];

    // Calculate statistics
    const totalInvitations = invitationsWithResponseTime.length;
    const accepted = invitationsWithResponseTime.filter(i => i.status === 'accepted').length;
    const declined = invitationsWithResponseTime.filter(i => i.status === 'declined').length;
    const pending = invitationsWithResponseTime.filter(i => i.status === 'invited').length;
    const responded = accepted + declined;
    const responseRate = totalInvitations > 0 ? Math.round((responded / totalInvitations) * 100) : 0;

    // Calculate average response time (only for responded invitations)
    const respondedInvitations = invitationsWithResponseTime.filter(i => i.responseTimeHours !== null);
    const averageResponseTimeHours = respondedInvitations.length > 0
      ? Math.round(respondedInvitations.reduce((sum, i) => sum + (i.responseTimeHours || 0), 0) / respondedInvitations.length * 10) / 10
      : 0;

    // Calculate 48-hour response rate
    const respondedWithin48Hours = respondedInvitations.filter(
      i => i.responseTimeHours !== null && i.responseTimeHours <= 48
    ).length;
    const responseRate48Hours = responded > 0
      ? Math.round((respondedWithin48Hours / responded) * 100)
      : 0;

    res.json({
      invitations: invitationsWithResponseTime,
      stats: {
        totalInvitations,
        accepted,
        declined,
        pending,
        responseRate,
        averageResponseTimeHours,
        responseRate48Hours,
        respondedWithin48Hours
      }
    });
  } catch (error) {
    console.error('Get team responses error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Track a proposal stage start
 * POST /api/analytics/track-stage
 */
export const trackStageStart = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { proposalId, stage } = req.body;

    if (!proposalId || !stage) {
      res.status(400).json({
        error: 'Missing required fields',
        message: 'proposalId and stage are required'
      });
      return;
    }

    // Verify proposal belongs to user
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id, user_id')
      .eq('id', proposalId)
      .eq('user_id', req.userId)
      .single();

    if (proposalError || !proposal) {
      res.status(404).json({
        error: 'Proposal not found',
        message: 'Proposal does not exist or you do not have access'
      });
      return;
    }

    // Check if there's an incomplete tracking for this stage
    const { data: existing, error: existingError } = await supabase
      .from('proposal_time_tracking')
      .select('id')
      .eq('proposal_id', proposalId)
      .eq('stage', stage)
      .is('completed_at', null)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    // If already tracking, return existing
    if (existing) {
      res.json({
        message: 'Stage already being tracked',
        tracking: existing
      });
      return;
    }

    // Create new tracking record
    const { data: tracking, error: trackingError } = await supabase
      .from('proposal_time_tracking')
      .insert({
        proposal_id: proposalId,
        stage,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (trackingError) throw trackingError;

    res.status(201).json({
      message: 'Stage tracking started',
      tracking
    });
  } catch (error) {
    console.error('Track stage start error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Track a proposal stage completion
 * PUT /api/analytics/track-stage/:id/complete
 */
export const trackStageComplete = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { id } = req.params;

    // Get tracking record and verify proposal ownership
    const { data: tracking, error: trackingError } = await supabase
      .from('proposal_time_tracking')
      .select(`
        id,
        proposal_id,
        proposals!proposal_time_tracking_proposal_id_fkey (
          user_id
        )
      `)
      .eq('id', id)
      .single();

    if (trackingError || !tracking) {
      res.status(404).json({
        error: 'Tracking record not found',
        message: 'Tracking record does not exist'
      });
      return;
    }

    // Verify proposal belongs to user
    if ((tracking.proposals as any)?.user_id !== req.userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this tracking record'
      });
      return;
    }

    // Update tracking record
    const { data: updated, error: updateError } = await supabase
      .from('proposal_time_tracking')
      .update({
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      message: 'Stage tracking completed',
      tracking: updated
    });
  } catch (error) {
    console.error('Track stage complete error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};




