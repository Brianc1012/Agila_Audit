// ============================================================================
// DEPARTMENT ADMIN ROUTES - Access to department-specific audit logs
// ============================================================================

import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireDepartmentAdmin } from '../middlewares/roleAccess.middleware';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { readRateLimiter, writeRateLimiter } from '../middlewares/rateLimit.middleware';
import {
  createAuditLogHandler,
  getAuditLogsHandler,
  getAuditLogByIdHandler,
  getEntityHistoryHandler,
  getAuditLogStatsHandler,
  searchAuditLogsHandler,
} from '../controllers/auditLogs.controller';

const router = Router();

// All routes require Department Admin authentication
router.use(authenticateJWT);
router.use(requireDepartmentAdmin);

/**
 * Create new audit log
 * POST /api/department-admin/audit-logs
 */
router.post(
  '/audit-logs',
  writeRateLimiter,
  asyncHandler(createAuditLogHandler)
);

/**
 * Get department audit logs (filtered by department)
 * GET /api/department-admin/audit-logs
 */
router.get(
  '/audit-logs',
  readRateLimiter,
  asyncHandler(getAuditLogsHandler)
);

/**
 * Get department audit log statistics
 * GET /api/department-admin/audit-logs/stats
 */
router.get(
  '/audit-logs/stats',
  readRateLimiter,
  asyncHandler(getAuditLogStatsHandler)
);

/**
 * Search department audit logs
 * GET /api/department-admin/audit-logs/search
 */
router.get(
  '/audit-logs/search',
  readRateLimiter,
  asyncHandler(searchAuditLogsHandler)
);

/**
 * Get entity history (department users only)
 * GET /api/department-admin/audit-logs/history/:entity_type/:entity_id
 */
router.get(
  '/audit-logs/history/:entity_type/:entity_id',
  readRateLimiter,
  asyncHandler(getEntityHistoryHandler)
);

/**
 * Get single audit log by ID (department users only)
 * GET /api/department-admin/audit-logs/:id
 */
router.get(
  '/audit-logs/:id',
  readRateLimiter,
  asyncHandler(getAuditLogByIdHandler)
);

export default router;
