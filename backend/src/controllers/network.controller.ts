import { Request, Response } from 'express';
import { supabase } from '../utils/supabase.js';

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
