import { Request, Response } from 'express';
import { supabase } from '../utils/supabase.js';
import {
  sendConnectionRequestEmail
} from '../services/email.service.js';

/**
 * Get all network connections for the authenticated user
 * GET /api/network/connections
 */
export const getUserConnections = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { search, capability, limit = '50', offset = '0' } = req.query;

    // Build query
    let query = supabase
      .from('network_connections')
      .select(`
        id,
        contact_name,
        contact_email,
        capabilities,
        notes,
        connection_method,
        connected_at,
        connected_profile_id,
        company_profiles:connected_profile_id (
          id,
          company_name,
          industry,
          visibility
        )
      `)
      .eq('user_id', req.userId)
      .order('connected_at', { ascending: false });

    // Filter by search term (name or email)
    if (search && typeof search === 'string') {
      query = query.or(`contact_name.ilike.%${search}%,contact_email.ilike.%${search}%`);
    }

    // Filter by capability (array contains)
    if (capability && typeof capability === 'string') {
      query = query.contains('capabilities', [capability]);
    }

    // Pagination
    const limitNum = parseInt(limit as string) || 50;
    const offsetNum = parseInt(offset as string) || 0;
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: connections, error, count } = await query;

    if (error) throw error;

    res.json({
      connections: connections || [],
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: count
      }
    });
  } catch (error) {
    console.error('Get user connections error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get a specific network connection by ID
 * GET /api/network/connections/:id
 */
export const getConnectionById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { id } = req.params;

    const { data: connection, error } = await supabase
      .from('network_connections')
      .select(`
        *,
        company_profiles:connected_profile_id (
          id,
          company_name,
          industry,
          visibility,
          contact_info
        )
      `)
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !connection) {
      res.status(404).json({
        error: 'Connection not found',
        message: 'Network connection not found or access denied'
      });
      return;
    }

    res.json({
      connection
    });
  } catch (error) {
    console.error('Get connection by ID error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create a new network connection (manual entry)
 * POST /api/network/connections
 */
export const createConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const {
      contactName,
      contactEmail,
      capabilities,
      notes,
      connectedProfileId,
      connectionMethod = 'manual'
    } = req.body;

    // Validation
    if (!contactName || !contactEmail) {
      res.status(400).json({
        error: 'Missing required fields',
        message: 'Contact name and email are required'
      });
      return;
    }

    // Email validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
      return;
    }

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('network_connections')
      .select('id')
      .eq('user_id', req.userId)
      .eq('contact_email', contactEmail)
      .single();

    if (existing) {
      res.status(409).json({
        error: 'Connection exists',
        message: 'A connection with this email already exists'
      });
      return;
    }

    // Create connection
    const { data: connection, error: insertError } = await supabase
      .from('network_connections')
      .insert({
        user_id: req.userId,
        contact_name: contactName,
        contact_email: contactEmail,
        capabilities: capabilities || [],
        notes: notes || null,
        connected_profile_id: connectedProfileId || null,
        connection_method: connectionMethod
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      message: 'Connection created successfully',
      connection
    });
  } catch (error) {
    console.error('Create connection error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update a network connection
 * PUT /api/network/connections/:id
 */
export const updateConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { id } = req.params;
    const { contactName, contactEmail, capabilities, notes } = req.body;

    // Build update object
    const updateData: any = {};
    if (contactName !== undefined) updateData.contact_name = contactName;
    if (contactEmail !== undefined) updateData.contact_email = contactEmail;
    if (capabilities !== undefined) updateData.capabilities = capabilities;
    if (notes !== undefined) updateData.notes = notes;

    // Email validation if updating email
    if (contactEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        res.status(400).json({
          error: 'Invalid email',
          message: 'Please provide a valid email address'
        });
        return;
      }
    }

    // Update connection
    const { data: connection, error: updateError } = await supabase
      .from('network_connections')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (updateError || !connection) {
      res.status(404).json({
        error: 'Connection not found',
        message: 'Network connection not found or access denied'
      });
      return;
    }

    res.json({
      message: 'Connection updated successfully',
      connection
    });
  } catch (error) {
    console.error('Update connection error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete a network connection
 * DELETE /api/network/connections/:id
 */
export const deleteConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { id } = req.params;

    const { error: deleteError } = await supabase
      .from('network_connections')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (deleteError) throw deleteError;

    res.json({
      message: 'Connection deleted successfully'
    });
  } catch (error) {
    console.error('Delete connection error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Search network connections by capability
 * GET /api/network/connections/search/capabilities
 */
export const searchByCapability = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { q, limit = '50' } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        error: 'Missing query',
        message: 'Please provide a capability search query'
      });
      return;
    }

    const limitNum = parseInt(limit as string) || 50;

    // Search connections where capabilities array contains the query
    const { data: connections, error } = await supabase
      .from('network_connections')
      .select(`
        id,
        contact_name,
        contact_email,
        capabilities,
        notes,
        connected_at,
        company_profiles:connected_profile_id (
          company_name,
          industry
        )
      `)
      .eq('user_id', req.userId)
      .contains('capabilities', [q])
      .limit(limitNum);

    if (error) throw error;

    res.json({
      query: q,
      results: connections || []
    });
  } catch (error) {
    console.error('Search by capability error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get connection statistics
 * GET /api/network/connections/stats
 */
export const getConnectionStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('network_connections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId);

    if (countError) throw countError;

    // Get count by connection method
    const { data: methodCounts, error: methodError } = await supabase
      .from('network_connections')
      .select('connection_method')
      .eq('user_id', req.userId);

    if (methodError) throw methodError;

    const methodStats = {
      manual: 0,
      qr: 0,
      marketplace: 0
    };

    methodCounts?.forEach((conn: any) => {
      if (conn.connection_method in methodStats) {
        methodStats[conn.connection_method as keyof typeof methodStats]++;
      }
    });

    // Get all unique capabilities
    const { data: allConnections, error: capError } = await supabase
      .from('network_connections')
      .select('capabilities')
      .eq('user_id', req.userId);

    if (capError) throw capError;

    const capabilitySet = new Set<string>();
    allConnections?.forEach((conn: any) => {
      if (conn.capabilities && Array.isArray(conn.capabilities)) {
        conn.capabilities.forEach((cap: string) => capabilitySet.add(cap));
      }
    });

    res.json({
      totalConnections: totalCount || 0,
      connectionsByMethod: methodStats,
      totalUniqueCapabilities: capabilitySet.size,
      topCapabilities: Array.from(capabilitySet).slice(0, 10)
    });
  } catch (error) {
    console.error('Get connection stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Send a connection request to another user
 * POST /api/network/connection-requests
 */
export const sendConnectionRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const {
      recipientProfileId,
      message
    } = req.body;

    // Validation
    if (!recipientProfileId) {
      res.status(400).json({
        error: 'Missing required fields',
        message: 'Recipient profile ID is required'
      });
      return;
    }

    // Get requester's profile
    const { data: requesterProfile, error: requesterProfileError } = await supabase
      .from('company_profiles')
      .select('id, company_name, user_id')
      .eq('user_id', req.userId)
      .single();

    if (requesterProfileError || !requesterProfile) {
      res.status(404).json({
        error: 'Profile not found',
        message: 'You must have a company profile to send connection requests'
      });
      return;
    }

    // Get recipient's profile and user
    const { data: recipientProfile, error: recipientProfileError } = await supabase
      .from('company_profiles')
      .select('id, company_name, user_id, contact_info')
      .eq('id', recipientProfileId)
      .single();

    if (recipientProfileError || !recipientProfile) {
      res.status(404).json({
        error: 'Profile not found',
        message: 'Recipient profile does not exist'
      });
      return;
    }

    // Check if user is trying to connect with themselves
    if (recipientProfile.user_id === req.userId) {
      res.status(400).json({
        error: 'Invalid request',
        message: 'You cannot send a connection request to yourself'
      });
      return;
    }

    // Check if a pending request already exists
    const { data: existingRequest } = await supabase
      .from('connection_requests')
      .select('id, status')
      .eq('requester_id', req.userId)
      .eq('recipient_profile_id', recipientProfileId)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      res.status(409).json({
        error: 'Request already exists',
        message: 'You have already sent a connection request to this company'
      });
      return;
    }

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('network_connections')
      .select('id')
      .eq('user_id', req.userId)
      .eq('connected_profile_id', recipientProfileId)
      .single();

    if (existingConnection) {
      res.status(409).json({
        error: 'Connection exists',
        message: 'You are already connected with this company'
      });
      return;
    }

    // Create connection request
    const { data: connectionRequest, error: insertError } = await supabase
      .from('connection_requests')
      .insert({
        requester_id: req.userId,
        requester_profile_id: requesterProfile.id,
        recipient_profile_id: recipientProfileId,
        recipient_user_id: recipientProfile.user_id,
        message: message || null,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Get recipient's email from their profile or auth
    let recipientEmail = '';
    if (recipientProfile.contact_info && typeof recipientProfile.contact_info === 'object') {
      recipientEmail = (recipientProfile.contact_info as any).email || '';
    }

    // If no email in profile, try to get from auth
    if (!recipientEmail) {
      const { data: recipientUser } = await supabase.auth.admin.getUserById(recipientProfile.user_id);
      recipientEmail = recipientUser?.user?.email || '';
    }

    // Send email notification (non-blocking)
    if (recipientEmail) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://rfp-response-generator.vercel.app';
      const invitationLink = `${frontendUrl}/invitations`;

      sendConnectionRequestEmail({
        recipientEmail,
        requesterCompanyName: requesterProfile.company_name,
        recipientCompanyName: recipientProfile.company_name,
        message: message || undefined,
        invitationLink
      }).catch((err) => {
        console.error('Failed to send connection request email:', err);
        // Don't fail the request if email fails
      });
    }

    res.status(201).json({
      message: 'Connection request sent successfully',
      connectionRequest
    });
  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get connection requests for the authenticated user
 * GET /api/network/connection-requests
 */
export const getMyConnectionRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    // Get requests where user is the recipient (received requests)
    const { data: receivedRequests, error: receivedError } = await supabase
      .from('connection_requests')
      .select(`
        id,
        requester_id,
        requester_profile_id,
        recipient_profile_id,
        message,
        status,
        requested_at,
        responded_at,
        requester_profile:requester_profile_id (
          id,
          company_name,
          industry,
          contact_info
        ),
        recipient_profile:recipient_profile_id (
          id,
          company_name
        )
      `)
      .eq('recipient_user_id', req.userId)
      .order('requested_at', { ascending: false });

    if (receivedError) {
      console.error('Error fetching received connection requests:', receivedError);
      console.error('Error details:', {
        code: receivedError.code,
        message: receivedError.message,
        details: receivedError.details,
        hint: receivedError.hint
      });
      throw receivedError;
    }

    // Get requests where user is the requester (sent requests)
    const { data: sentRequests, error: sentError } = await supabase
      .from('connection_requests')
      .select(`
        id,
        requester_id,
        requester_profile_id,
        recipient_profile_id,
        message,
        status,
        requested_at,
        responded_at,
        requester_profile:requester_profile_id (
          id,
          company_name
        ),
        recipient_profile:recipient_profile_id (
          id,
          company_name,
          industry,
          contact_info
        )
      `)
      .eq('requester_id', req.userId)
      .order('requested_at', { ascending: false });

    if (sentError) {
      console.error('Error fetching sent connection requests:', sentError);
      console.error('Error details:', {
        code: sentError.code,
        message: sentError.message,
        details: sentError.details,
        hint: sentError.hint
      });
      throw sentError;
    }

    res.json({
      receivedRequests: receivedRequests || [],
      sentRequests: sentRequests || []
    });
  } catch (error) {
    console.error('Get my connection requests error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error && typeof error === 'object' && 'code' in error 
      ? { code: (error as any).code, details: (error as any).details, hint: (error as any).hint }
      : {};
    
    console.error('Full error object:', error);
    console.error('Error details:', errorDetails);
    
    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
      ...errorDetails
    });
  }
};

/**
 * Accept a connection request
 * POST /api/network/connection-requests/:id/accept
 */
export const acceptConnectionRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { id } = req.params;

    // Get the connection request
    const { data: connectionRequest, error: requestError } = await supabase
      .from('connection_requests')
      .select(`
        *,
        requester_profile:requester_profile_id (
          id,
          company_name,
          contact_info
        ),
        recipient_profile:recipient_profile_id (
          id,
          company_name,
          contact_info
        )
      `)
      .eq('id', id)
      .eq('recipient_user_id', req.userId)
      .single();

    if (requestError || !connectionRequest) {
      res.status(404).json({
        error: 'Request not found',
        message: 'Connection request not found or access denied'
      });
      return;
    }

    if (connectionRequest.status !== 'pending') {
      res.status(400).json({
        error: 'Invalid status',
        message: 'This connection request has already been responded to'
      });
      return;
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('connection_requests')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Create bidirectional connections in network_connections
    const requesterProfile = connectionRequest.requester_profile as any;
    const recipientProfile = connectionRequest.recipient_profile as any;

    // Connection for requester (requester -> recipient)
    const requesterContactInfo = requesterProfile?.contact_info || {};
    const requesterEmail = requesterContactInfo.email || '';
    const requesterCapabilities = requesterContactInfo.capabilities || [];

    const { error: requesterConnError } = await supabase
      .from('network_connections')
      .insert({
        user_id: connectionRequest.requester_id,
        connected_profile_id: connectionRequest.recipient_profile_id,
        contact_name: recipientProfile?.company_name || '',
        contact_email: '', // Will be populated from profile if available
        capabilities: recipientProfile?.contact_info?.capabilities || [],
        notes: 'Accepted connection request from marketplace',
        connection_method: 'marketplace'
      });

    if (requesterConnError) {
      console.error('Error creating requester connection:', requesterConnError);
      // Continue anyway - connection request is already accepted
    }

    // Connection for recipient (recipient -> requester)
    const recipientContactInfo = recipientProfile?.contact_info || {};
    const recipientEmail = recipientContactInfo.email || '';
    const recipientCapabilities = recipientContactInfo.capabilities || [];

    const { error: recipientConnError } = await supabase
      .from('network_connections')
      .insert({
        user_id: connectionRequest.recipient_user_id,
        connected_profile_id: connectionRequest.requester_profile_id,
        contact_name: requesterProfile?.company_name || '',
        contact_email: requesterEmail,
        capabilities: requesterCapabilities,
        notes: 'Accepted connection request from marketplace',
        connection_method: 'marketplace'
      });

    if (recipientConnError) {
      console.error('Error creating recipient connection:', recipientConnError);
      // Continue anyway - connection request is already accepted
    }

    res.json({
      message: 'Connection request accepted successfully',
      connectionRequest: {
        ...connectionRequest,
        status: 'accepted',
        responded_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Accept connection request error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Decline a connection request
 * POST /api/network/connection-requests/:id/decline
 */
export const declineConnectionRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { id } = req.params;

    // Get the connection request
    const { data: connectionRequest, error: requestError } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('id', id)
      .eq('recipient_user_id', req.userId)
      .single();

    if (requestError || !connectionRequest) {
      res.status(404).json({
        error: 'Request not found',
        message: 'Connection request not found or access denied'
      });
      return;
    }

    if (connectionRequest.status !== 'pending') {
      res.status(400).json({
        error: 'Invalid status',
        message: 'This connection request has already been responded to'
      });
      return;
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('connection_requests')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({
      message: 'Connection request declined successfully',
      connectionRequest: {
        ...connectionRequest,
        status: 'declined',
        responded_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Decline connection request error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
