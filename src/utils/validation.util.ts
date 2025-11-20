// ============================================================================
// VALIDATION UTILITY - INPUT VALIDATION HELPERS
// ============================================================================

import { CreateAuditLogDTO, AuditLogFilters } from '../types/auditLog';

/**
 * Validate audit log creation data (Updated for new schema)
 */
export function validateCreateAuditLog(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.entity_type || typeof data.entity_type !== 'string') {
    errors.push('entity_type is required and must be a string');
  }

  if (!data.entity_id || typeof data.entity_id !== 'string') {
    errors.push('entity_id is required and must be a string');
  }

  if (!data.action_type_code || typeof data.action_type_code !== 'string') {
    errors.push('action_type_code is required and must be a string (e.g., CREATE, UPDATE, DELETE)');
  }

  // action_by is optional but should be a string if provided
  if (data.action_by && typeof data.action_by !== 'string') {
    errors.push('action_by must be a string');
  }

  // previous_data and new_data should be objects if provided
  if (data.previous_data && typeof data.previous_data !== 'object') {
    errors.push('previous_data must be an object');
  }

  if (data.new_data && typeof data.new_data !== 'object') {
    errors.push('new_data must be an object');
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
 * Sanitize filter inputs (Updated for new schema)
 */
export function sanitizeFilters(filters: any): AuditLogFilters {
  return {
    ...(filters.entity_type && { entity_type: String(filters.entity_type) }),
    ...(filters.entity_id && { entity_id: String(filters.entity_id) }),
    ...(filters.action_type_code && { action_type_code: String(filters.action_type_code) }),
    ...(filters.action_by && { action_by: String(filters.action_by) }),
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

/**
 * Extract department from user ID
 * Assumes user ID format: DEPT-YYYYMMDD-XXX
 * e.g., "FIN-20250101-001" -> "finance"
 */
export function extractDepartmentFromUserId(userId: string): string | null {
  const deptCodes: Record<string, string> = {
    'FIN': 'finance',
    'HR': 'hr',
    'INV': 'inventory',
    'OPS': 'operations',
    'ADM': 'admin',
  };

  const match = userId.match(/^([A-Z]+)-/);
  if (match && deptCodes[match[1]]) {
    return deptCodes[match[1]];
  }

  return null;
}
