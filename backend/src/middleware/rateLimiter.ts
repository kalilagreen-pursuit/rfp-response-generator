import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Configuration
 * Protects API endpoints from abuse and controls costs
 */

// Strict rate limit for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many login/register attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === 'test';
  },
});

// Rate limit for expensive AI operations (proposal generation)
export const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 proposals per hour
  message: {
    error: 'Rate limit exceeded',
    message: 'Proposal generation limit reached (20 per hour). Please wait before generating more proposals.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Rate limit for AI refinement operations
export const aiRefinementLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 refinements per hour
  message: {
    error: 'Rate limit exceeded',
    message: 'Proposal refinement limit reached (50 per hour). Please wait before refining more content.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Rate limit for file uploads
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: {
    error: 'Upload limit exceeded',
    message: 'File upload limit reached (10 per hour). Please wait before uploading more files.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Rate limit for PDF/DOCX exports
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 exports per hour
  message: {
    error: 'Export limit exceeded',
    message: 'Export limit reached (30 per hour). Please wait before exporting more documents.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Rate limit for team invitations (prevent spam)
export const invitationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 50, // 50 invitations per day
  message: {
    error: 'Invitation limit exceeded',
    message: 'Team invitation limit reached (50 per day). Please wait before sending more invitations.',
    retryAfter: '24 hours'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

// General API rate limiter (applies to most read endpoints)
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests',
    message: 'Too many requests. Please slow down and try again.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Strict rate limit for analytics tracking (prevent database flooding)
export const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 tracking operations per minute
  message: {
    error: 'Analytics rate limit exceeded',
    message: 'Analytics tracking limit reached. Please wait before tracking more events.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});
