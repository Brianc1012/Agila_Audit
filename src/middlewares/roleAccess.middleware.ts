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
 * Apply access filter based on user role and service context
 * This function returns Prisma where clause filters
 */
export function applyAccessFilter(
  user: { id: string; username: string; role: string },
  serviceName?: string
): any {
  // SuperAdmin - No restrictions
  if (isSuperAdmin(user.role)) {
    return {};
  }

  // Department Admin - Can see all logs from their department
  if (isDepartmentAdmin(user.role)) {
    const department = extractDepartmentFromRole(user.role);
    
    if (department && serviceName) {
      // Ensure admin can only access their own department
      if (department !== serviceName) {
        return { id: -1 }; // Return impossible condition to block access
      }
      return {
        sourceService: serviceName,
      };
    }
    
    // If serviceName not provided, filter by role-based department
    if (department) {
      return {
        sourceService: department,
      };
    }
  }

  // Non-Admin - Can only see their own logs
  return {
    performedBy: user.id,
  };
}

/**
 * Middleware to enforce role-based access control
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

    // SuperAdmin - Full access
    if (isSuperAdmin(req.user.role)) {
      next();
      return;
    }

    // Department Admin - Check if accessing own department
    if (isDepartmentAdmin(req.user.role)) {
      const department = extractDepartmentFromRole(req.user.role);
      
      // If serviceName is set (from API key), verify it matches user's department
      if (req.serviceName && department !== req.serviceName) {
        sendForbidden(res, 'Cannot access other department logs');
        return;
      }

      // If query params include service filter, verify it matches
      if (req.query.service && department !== req.query.service) {
        sendForbidden(res, 'Cannot access other department logs');
        return;
      }

      next();
      return;
    }

    // Non-Admin - Can only access own logs
    // The actual filtering happens in the service layer using applyAccessFilter
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
