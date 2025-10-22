// ============================================================================
// RATE LIMIT MIDDLEWARE - API RATE LIMITING
// ============================================================================

import rateLimit from 'express-rate-limit';

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'); // 1 minute
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

/**
 * General rate limiter for API endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for SuperAdmin if needed
  skip: (req: any) => {
    return req.user?.role === 'SuperAdmin';
  },
});

/**
 * Strict rate limiter for write operations
 */
export const writeRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: Math.floor(MAX_REQUESTS / 2), // Half the general limit
  message: {
    success: false,
    message: 'Too many write requests, please try again later',
    code: 'WRITE_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Lenient rate limiter for read operations
 */
export const readRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS * 2, // Double the general limit
  message: {
    success: false,
    message: 'Too many read requests, please try again later',
    code: 'READ_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
