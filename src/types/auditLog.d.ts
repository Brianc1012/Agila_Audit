// ============================================================================
// TYPE DEFINITIONS - AUDIT LOGS MICROSERVICE
// ============================================================================

import { Request } from 'express';

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================
export interface JWTUser {
  id: string;          // User ID from JWT payload.sub
  username: string;    // Username from JWT payload
  role: string;        // e.g., "SuperAdmin", "Finance Admin", "HR Non-Admin"
}

// ============================================================================
// REQUEST EXTENSIONS
// ============================================================================
export interface AuthenticatedRequest extends Request {
  user?: JWTUser;           // Injected by auth.middleware
  serviceName?: string;     // Injected by apiKey.middleware
  apiKeyId?: number;        // Injected by apiKey.middleware
  body: any;                // Request body
  query: any;               // Query parameters
  params: any;              // Route parameters
  headers: any;             // Request headers
  ip?: string;              // Client IP address
  path: string;             // Request path
  method: string;           // HTTP method
  get(name: string): string | undefined; // Get header value
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================
export interface CreateAuditLogDTO {
  moduleName: string;
  recordId?: string;
  recordCode?: string;
  action: string;
  performedBy: string;
  performedByName?: string;
  performedByRole?: string;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  oldValues?: string | object;
  newValues?: string | object;
  changedFields?: string | object;
  reason?: string;
  metadata?: string | object;
  processingTimeMs?: number;
}

export interface AuditLogFilters {
  userId?: string;
  service?: string;
  moduleName?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// API KEY TYPES
// ============================================================================
export interface CreateApiKeyDTO {
  serviceName: string;
  description?: string;
  canWrite?: boolean;
  canRead?: boolean;
  allowedModules?: string[];
  expiresAt?: Date;
  createdBy?: string;
}

export interface ApiKeyValidationResult {
  isValid: boolean;
  apiKey?: {
    id: number;
    serviceName: string;
    canWrite: boolean;
    canRead: boolean;
    allowedModules?: string;
  };
  error?: string;
}

// ============================================================================
// SUMMARY TYPES
// ============================================================================
export interface SummaryFilters {
  dateFrom?: string;
  dateTo?: string;
  service?: string;
  moduleName?: string;
  action?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface AggregatedSummary {
  date: Date;
  sourceService: string;
  moduleName: string;
  action: string;
  totalCount: number;
  uniqueUsers: number;
  avgProcessingTime?: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================
export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  code?: string;
}

// ============================================================================
// ACCESS CONTROL TYPES
// ============================================================================
export enum UserRole {
  SUPER_ADMIN = 'SuperAdmin',
  FINANCE_ADMIN = 'Finance Admin',
  FINANCE_NON_ADMIN = 'Finance Non-Admin',
  HR_ADMIN = 'HR Admin',
  HR_NON_ADMIN = 'HR Non-Admin',
  INVENTORY_ADMIN = 'Inventory Admin',
  INVENTORY_NON_ADMIN = 'Inventory Non-Admin',
  OPERATIONS_ADMIN = 'Operations Admin',
  OPERATIONS_NON_ADMIN = 'Operations Non-Admin',
}

export interface AccessControlContext {
  user: JWTUser;
  serviceName?: string;
  requestedService?: string;
}
