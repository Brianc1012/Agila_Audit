// ============================================================================
// AUTH MIDDLEWARE - JWT TOKEN VERIFICATION
// ============================================================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auditLog';
import { verifyToken, extractToken } from '../utils/jwt.util';
import { sendUnauthorized } from '../utils/response.util';

/**
 * Middleware to verify JWT token and attach user to request
 */
export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // 🔓 QUICK BYPASS FOR TESTING - Set DISABLE_AUTH=true in .env
  if (process.env.DISABLE_AUTH === 'true') {
    console.log('⚠️  AUTH DISABLED - Using mock user for testing');
    req.user = {
      id: process.env.TEST_USER_ID || 'test_user_001',
      username: process.env.TEST_USERNAME || 'test_admin',
      role: process.env.TEST_USER_ROLE || 'SuperAdmin'  // Change to test different roles
    };
    next();
    return;
  }

  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (!token) {
      sendUnauthorized(res, 'No token provided');
      return;
    }

    const user = verifyToken(token);
    req.user = user;

    next();
  } catch (error: any) {
    sendUnauthorized(res, error.message || 'Invalid or expired token');
  }
}

/**
 * Optional JWT authentication - attaches user if token is present but doesn't require it
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // 🔓 QUICK BYPASS FOR TESTING
  if (process.env.DISABLE_AUTH === 'true') {
    req.user = {
      id: process.env.TEST_USER_ID || 'test_user_001',
      username: process.env.TEST_USERNAME || 'test_admin',
      role: process.env.TEST_USER_ROLE || 'SuperAdmin'
    };
    next();
    return;
  }

  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (token) {
      const user = verifyToken(token);
      req.user = user;
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
}
