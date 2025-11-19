import { Request, Response, NextFunction } from 'express';
import { supabaseAnon } from '../utils/supabase.js';
import { User } from '@supabase/supabase-js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

/**
 * Middleware to verify JWT token and authenticate user
 * Adds user object to req.user
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header provided'
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for endpoints that work for both authenticated and anonymous users
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    // Try to verify token
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (!error && user) {
      req.user = user;
      req.userId = user.id;
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors
    console.error('Optional authentication error:', error);
    next();
  }
};

/**
 * Middleware to validate request body fields
 */
export const validateFields = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: `The following fields are required: ${missingFields.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user email is confirmed
 */
export const requireEmailConfirmed = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User not authenticated'
    });
  }

  if (!req.user.email_confirmed_at) {
    return res.status(403).json({
      error: 'Email not confirmed',
      message: 'Please confirm your email address to access this resource'
    });
  }

  next();
};
