// ============================================================================
// AUDIT LOGS CONTROLLER - REQUEST HANDLERS
// ============================================================================

import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auditLog';
import {
  sendSuccess,
  sendError,
  sendNotFound,
} from '../utils/response.util';
import {
  validateCreateAuditLog,
  sanitizeFilters,
} from '../utils/validation.util';
import {
  createAuditLog,
  getAuditLogs,
  getAuditLogById,
  deleteAuditLog,
  getAuditLogStats,
  searchAuditLogs,
} from '../services/auditLogs.service';
import cache from '../utils/cache.util';
import dedupService from '../services/dedup.service';

/**
 * Create new audit log entry
 * POST /api/audit-logs
 */
export async function createAuditLogHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const validation = validateCreateAuditLog(req.body);

    if (!validation.isValid) {
      sendError(res, 'Validation failed', validation.errors.join(', '));
      return;
    }

    if (!req.serviceName) {
      sendError(res, 'Service name not identified');
      return;
    }

    // Check for duplicate event (idempotency)
    const eventId = req.body.eventId || req.headers['idempotency-key'] as string;
    if (eventId) {
      const isDuplicate = await dedupService.isDuplicate(eventId, req.serviceName);
      if (isDuplicate) {
        // Return 202 Accepted for duplicate (idempotent response)
        sendSuccess(
          res,
          'Event already processed (idempotent)',
          { eventId, duplicate: true },
          undefined,
          202
        );
        return;
      }
    }

    const startTime = Date.now();

    const auditLog = await createAuditLog(
      {
        ...req.body,
        eventId,
        ipAddress: req.body.ipAddress || req.ip,
        userAgent: req.body.userAgent || req.get('user-agent'),
        requestMethod: req.method,
        requestPath: req.path,
      },
      req.serviceName,
      req.apiKeyId
    );

    const processingTime = Date.now() - startTime;

    // Mark event as processed for idempotency
    if (eventId) {
      await dedupService.markAsProcessed(eventId, req.serviceName);
    }

    // Invalidate relevant caches after creating audit log
    await cache.invalidateSummaries();
    await cache.invalidateStats();
    // Also invalidate service-specific cache if needed
    if (req.serviceName) {
      await cache.invalidateService(req.serviceName);
    }

    sendSuccess(
      res,
      'Audit log created successfully',
      {
        id: auditLog.id,
        eventId: eventId || auditLog.id.toString(),
        processingTimeMs: processingTime,
      },
      undefined,
      202 // Use 202 Accepted for async audit processing
    );
  } catch (error: any) {
    console.error('Create audit log error:', error);
    sendError(res, 'Failed to create audit log', error.message, undefined, 500);
  }
}

/**
 * Get audit logs with filters
 * GET /api/audit-logs
 */
export async function getAuditLogsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User authentication required', undefined, undefined, 401);
      return;
    }

    const filters = sanitizeFilters(req.query);

    const result = await getAuditLogs(filters, req.user, req.serviceName);

    sendSuccess(res, 'Audit logs retrieved successfully', result.logs, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    });
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    sendError(res, 'Failed to retrieve audit logs', error.message, undefined, 500);
  }
}

/**
 * Get single audit log by ID
 * GET /api/audit-logs/:id
 */
export async function getAuditLogByIdHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User authentication required', undefined, undefined, 401);
      return;
    }

    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      sendError(res, 'Invalid audit log ID');
      return;
    }

    const log = await getAuditLogById(id, req.user, req.serviceName);

    if (!log) {
      sendNotFound(res, 'Audit log not found or access denied');
      return;
    }

    sendSuccess(res, 'Audit log retrieved successfully', log);
  } catch (error: any) {
    console.error('Get audit log by ID error:', error);
    sendError(res, 'Failed to retrieve audit log', error.message, undefined, 500);
  }
}

/**
 * Delete audit log (SuperAdmin only)
 * DELETE /api/audit-logs/:id
 */
export async function deleteAuditLogHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      sendError(res, 'Invalid audit log ID');
      return;
    }

    await deleteAuditLog(id);

    // Invalidate caches after deletion
    await cache.invalidateSummaries();
    await cache.invalidateStats();

    sendSuccess(res, 'Audit log deleted successfully');
  } catch (error: any) {
    console.error('Delete audit log error:', error);
    sendError(res, 'Failed to delete audit log', error.message, undefined, 500);
  }
}

/**
 * Get audit log statistics
 * GET /api/audit-logs/stats
 */
export async function getAuditLogStatsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User authentication required', undefined, undefined, 401);
      return;
    }

    const stats = await getAuditLogStats(req.user, req.serviceName);

    sendSuccess(res, 'Statistics retrieved successfully', stats);
  } catch (error: any) {
    console.error('Get stats error:', error);
    sendError(res, 'Failed to retrieve statistics', error.message, undefined, 500);
  }
}

/**
 * Search audit logs
 * GET /api/audit-logs/search
 */
export async function searchAuditLogsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User authentication required', undefined, undefined, 401);
      return;
    }

    const searchTerm = req.query.q as string;

    if (!searchTerm) {
      sendError(res, 'Search term is required');
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await searchAuditLogs(
      searchTerm,
      req.user,
      req.serviceName,
      page,
      limit
    );

    sendSuccess(res, 'Search completed successfully', result.logs, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error: any) {
    console.error('Search audit logs error:', error);
    sendError(res, 'Failed to search audit logs', error.message, undefined, 500);
  }
}
