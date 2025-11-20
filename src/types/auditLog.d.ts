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
// AUDIT LOG TYPES (Updated for new schema)
// ============================================================================
export interface CreateAuditLogDTO {
  entity_type: string;        // e.g., "purchase_request", "budget", "user"
  entity_id: string;          // ID of the entity being logged
  action_type_code: string;   // Code from action_type table (CREATE, UPDATE, DELETE, etc.)
  action_by?: string;         // User ID who performed the action
  previous_data?: object;     // Previous state (only changed fields)
  new_data?: object;          // New state (only changed fields)
}

export interface AuditLogFilters {
  entity_type?: string;
  entity_id?: string;
  action_type_code?: string;
  action_by?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogResponse {
  id: number;
  entity_type: string;
  entity_id: string;
  action_type: {
    id: number;
    code: string;
    description: string | null;
  };
  action_by: string | null;
  action_at: Date;
  previous_data: any;
  new_data: any;
  version: number;
  created_at: Date;
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
