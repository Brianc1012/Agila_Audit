// ============================================================================
// ROLE ACCESS MIDDLEWARE - ENFORCE ACCESS CONTROL RULES
// ============================================================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auditLog';
import { sendForbidden, sendUnauthorized } from '../utils/response.util';
import {
  isSuperAdmin,
  isDepartmentAdmin,
  extractDepartmentFromRole,
} from '../utils/validation.util';

/**
 * Apply access filter based on user role (deprecated - moved to service layer)
 * This function is kept for backward compatibility
 */
export function applyAccessFilter(
  user: { id: string; username: string; role: string },
  serviceName?: string
): any {
  // SuperAdmin - No restrictions
  if (isSuperAdmin(user.role)) {
    return {};
  }

  // Department Admin - Can see all logs from their department users
  if (isDepartmentAdmin(user.role)) {
    const department = extractDepartmentFromRole(user.role);
    const deptCodes: Record<string, string> = {
      'finance': 'FIN',
      'hr': 'HR',
      'inventory': 'INV',
      'operations': 'OPS',
    };

    const deptCode = deptCodes[department || ''];
    if (deptCode) {
      return {
        action_by: {
          startsWith: deptCode,
        },
      };
    }
  }

  // Non-Admin - Can only see their own logs
  return {
    action_by: user.id,
  };
}

/**
 * Middleware to enforce role-based access control (simplified)
 */
export function enforceRoleAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // 🔓 QUICK BYPASS FOR TESTING
  if (process.env.DISABLE_AUTH === 'true') {
    console.log('⚠️  ROLE ACCESS CONTROL DISABLED - Bypassing for testing');
    next();
    return;
  }

  try {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }

    // All authenticated users can access their respective endpoints
    // Actual filtering happens in the service layer based on user role
    next();
  } catch (error: any) {
    console.error('Role access enforcement error:', error);
    sendForbidden(res, 'Access control check failed');
  }
}

/**
 * Middleware to require SuperAdmin role
 */
export function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // 🔓 QUICK BYPASS FOR TESTING
  if (process.env.DISABLE_AUTH === 'true') {
    console.log('⚠️  SUPERADMIN CHECK DISABLED - Bypassing for testing');
    next();
    return;
  }

  if (!req.user) {
    sendUnauthorized(res, 'Authentication required');
    return;
  }

  if (!isSuperAdmin(req.user.role)) {
    sendForbidden(res, 'SuperAdmin access required');
    return;
  }

  next();
}

/**
 * Middleware to require department admin role
 */
export function requireDepartmentAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // 🔓 QUICK BYPASS FOR TESTING
  if (process.env.DISABLE_AUTH === 'true') {
    console.log('⚠️  DEPARTMENT ADMIN CHECK DISABLED - Bypassing for testing');
    next();
    return;
  }

  if (!req.user) {
    sendUnauthorized(res, 'Authentication required');
    return;
  }

  if (!isSuperAdmin(req.user.role) && !isDepartmentAdmin(req.user.role)) {
    sendForbidden(res, 'Department Admin access required');
    return;
  }

  next();
}
