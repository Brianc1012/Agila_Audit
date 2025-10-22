// ============================================================================
// JWT UTILITY - TOKEN VERIFICATION
// ============================================================================

import jwt from 'jsonwebtoken';
import { JWTUser } from '../types/auditLog';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecurejwtsecret';

/**
 * Verify and decode a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded user payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): JWTUser {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    return {
      id: decoded.sub || decoded.id,
      username: decoded.username,
      role: decoded.role,
    };
  } catch (error: any) {
    throw new Error(`Invalid token: ${error.message}`);
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - The Authorization header value
 * @returns The extracted token or null
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}
