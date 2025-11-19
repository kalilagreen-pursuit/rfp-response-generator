import { Request, Response } from 'express';
import { supabase, supabaseAnon } from '../utils/supabase.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, companyName } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Password must be at least 8 characters'
      });
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: {
        data: {
          company_name: companyName || null
        }
      }
    });

    if (authError) {
      return res.status(400).json({
        error: 'Registration failed',
        message: authError.message
      });
    }

    if (!authData.user) {
      return res.status(400).json({
        error: 'Registration failed',
        message: 'Failed to create user'
      });
    }

    // Create company profile (using service role to bypass RLS during creation)
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .insert({
        user_id: authData.user.id,
        company_name: companyName || 'My Company',
        visibility: 'private',
        profile_strength: 0
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail registration if profile creation fails
      // User can create profile later
    }

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        emailConfirmed: authData.user.email_confirmed_at !== null
      },
      profile: profile || null,
      session: authData.session
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({
        error: 'Login failed',
        message: authError.message
      });
    }

    if (!authData.user || !authData.session) {
      return res.status(401).json({
        error: 'Login failed',
        message: 'Invalid credentials'
      });
    }

    // Get user's company profile
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    res.json({
      message: 'Login successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        emailConfirmed: authData.user.email_confirmed_at !== null
      },
      profile: profile || null,
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
        expires_in: authData.session.expires_in
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    // Sign out from Supabase
    const { error } = await supabaseAnon.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
    }

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Get user's company profile
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at !== null,
        createdAt: user.created_at
      },
      profile: profile || null
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'Missing refresh token',
        message: 'Refresh token is required'
      });
    }

    // Refresh session
    const { data, error } = await supabaseAnon.auth.refreshSession({
      refresh_token
    });

    if (error || !data.session) {
      return res.status(401).json({
        error: 'Token refresh failed',
        message: error?.message || 'Invalid refresh token'
      });
    }

    res.json({
      message: 'Token refreshed successfully',
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Missing email',
        message: 'Email is required'
      });
    }

    const { error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) {
      return res.status(400).json({
        error: 'Password reset failed',
        message: error.message
      });
    }

    res.json({
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Reset token required'
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Password must be at least 8 characters'
      });
    }

    // Update password
    const { error } = await supabaseAnon.auth.updateUser({
      password
    });

    if (error) {
      return res.status(400).json({
        error: 'Password reset failed',
        message: error.message
      });
    }

    res.json({
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
