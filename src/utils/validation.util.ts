// ============================================================================
// VALIDATION UTILITY - INPUT VALIDATION HELPERS
// ============================================================================

import { CreateAuditLogDTO, AuditLogFilters } from '../types/auditLog';

/**
 * Validate audit log creation data
 */
export function validateCreateAuditLog(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.moduleName || typeof data.moduleName !== 'string') {
    errors.push('moduleName is required and must be a string');
  }

  if (!data.action || typeof data.action !== 'string') {
    errors.push('action is required and must be a string');
  }

  if (!data.performedBy || typeof data.performedBy !== 'string') {
    errors.push('performedBy is required and must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: any, limit?: any): {
  page: number;
  limit: number;
} {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

  return { page: validPage, limit: validLimit };
}

/**
 * Sanitize filter inputs
 */
export function sanitizeFilters(filters: any): AuditLogFilters {
  return {
    ...(filters.userId && { userId: String(filters.userId) }),
    ...(filters.service && { service: String(filters.service) }),
    ...(filters.moduleName && { moduleName: String(filters.moduleName) }),
    ...(filters.action && { action: String(filters.action) }),
    ...(filters.dateFrom && isValidDate(filters.dateFrom) && { dateFrom: filters.dateFrom }),
    ...(filters.dateTo && isValidDate(filters.dateTo) && { dateTo: filters.dateTo }),
    ...validatePagination(filters.page, filters.limit),
    ...(filters.sortBy && { sortBy: String(filters.sortBy) }),
    ...(filters.sortOrder && ['asc', 'desc'].includes(filters.sortOrder) && {
      sortOrder: filters.sortOrder,
    }),
  };
}

/**
 * Check if user role is SuperAdmin
 */
export function isSuperAdmin(role: string): boolean {
  return role === 'SuperAdmin';
}

/**
 * Check if user role is a department admin
 */
export function isDepartmentAdmin(role: string): boolean {
  return role.includes('Admin') && !isSuperAdmin(role);
}

/**
 * Extract department from role
 * e.g., "Finance Admin" -> "finance"
 */
export function extractDepartmentFromRole(role: string): string | null {
  const match = role.match(/^(\w+)\s+(Admin|Non-Admin)$/i);
  return match ? match[1].toLowerCase() : null;
}
