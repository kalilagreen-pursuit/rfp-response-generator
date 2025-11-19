import { Request, Response } from 'express';
import { supabase } from '../utils/supabase.js';

/**
 * Get user's company profile
 * GET /api/profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { data: profile, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'No profile exists for this user'
        });
      }
      throw error;
    }

    res.json({
      profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create or update user's company profile
 * PUT /api/profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { companyName, industry, contactInfo, visibility } = req.body;

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', req.userId)
      .single();

    let profile;

    if (existingProfile) {
      // Update existing profile
      const updateData: any = {};
      if (companyName !== undefined) updateData.company_name = companyName;
      if (industry !== undefined) updateData.industry = industry;
      if (contactInfo !== undefined) updateData.contact_info = contactInfo;
      if (visibility !== undefined) updateData.visibility = visibility;

      const { data, error } = await supabase
        .from('company_profiles')
        .update(updateData)
        .eq('user_id', req.userId)
        .select()
        .single();

      if (error) throw error;
      profile = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('company_profiles')
        .insert({
          user_id: req.userId,
          company_name: companyName || 'My Company',
          industry: industry || null,
          contact_info: contactInfo || {},
          visibility: visibility || 'private'
        })
        .select()
        .single();

      if (error) throw error;
      profile = data;
    }

    // Calculate profile strength
    const { data: strengthData } = await supabase
      .rpc('calculate_profile_strength', { profile_id: profile.id });

    if (strengthData !== null) {
      await supabase
        .from('company_profiles')
        .update({ profile_strength: strengthData })
        .eq('id', profile.id);

      profile.profile_strength = strengthData;
    }

    res.json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete user's company profile
 * DELETE /api/profile
 */
export const deleteProfile = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { error } = await supabase
      .from('company_profiles')
      .delete()
      .eq('user_id', req.userId);

    if (error) throw error;

    res.json({
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get public profiles (marketplace)
 * GET /api/profile/marketplace
 */
export const getMarketplaceProfiles = async (req: Request, res: Response) => {
  try {
    const { industry, search, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('company_profiles')
      .select('*')
      .eq('visibility', 'public')
      .order('profile_strength', { ascending: false });

    // Filter by industry
    if (industry && typeof industry === 'string') {
      query = query.eq('industry', industry);
    }

    // Search by company name
    if (search && typeof search === 'string') {
      query = query.ilike('company_name', `%${search}%`);
    }

    // Pagination
    const limitNum = parseInt(limit as string) || 20;
    const offsetNum = parseInt(offset as string) || 0;
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: profiles, error, count } = await query;

    if (error) throw error;

    res.json({
      profiles: profiles || [],
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: count
      }
    });
  } catch (error) {
    console.error('Get marketplace profiles error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get profile by ID (public profiles only)
 * GET /api/profile/:id
 */
export const getProfileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: profile, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('id', id)
      .eq('visibility', 'public')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'Profile does not exist or is not public'
        });
      }
      throw error;
    }

    res.json({
      profile
    });
  } catch (error) {
    console.error('Get profile by ID error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
