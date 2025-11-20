// ============================================================================
// SUPER ADMIN ROUTES - Full access to all audit logs
// ============================================================================

import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireSuperAdmin } from '../middlewares/roleAccess.middleware';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { readRateLimiter, writeRateLimiter } from '../middlewares/rateLimit.middleware';
import {
  createAuditLogHandler,
  getAuditLogsHandler,
  getAuditLogByIdHandler,
  getEntityHistoryHandler,
  deleteAuditLogHandler,
  getAuditLogStatsHandler,
  searchAuditLogsHandler,
} from '../controllers/auditLogs.controller';

const router = Router();

// All routes require SuperAdmin authentication
router.use(authenticateJWT);
router.use(requireSuperAdmin);

/**
 * Create new audit log
 * POST /api/super-admin/audit-logs
 */
router.post(
  '/audit-logs',
  writeRateLimiter,
  asyncHandler(createAuditLogHandler)
);

/**
 * Get all audit logs (no restrictions)
 * GET /api/super-admin/audit-logs
 */
router.get(
  '/audit-logs',
  readRateLimiter,
  asyncHandler(getAuditLogsHandler)
);

/**
 * Get audit log statistics
 * GET /api/super-admin/audit-logs/stats
 */
router.get(
  '/audit-logs/stats',
  readRateLimiter,
  asyncHandler(getAuditLogStatsHandler)
);

/**
 * Search audit logs
 * GET /api/super-admin/audit-logs/search
 */
router.get(
  '/audit-logs/search',
  readRateLimiter,
  asyncHandler(searchAuditLogsHandler)
);

/**
 * Get entity history
 * GET /api/super-admin/audit-logs/history/:entity_type/:entity_id
 */
router.get(
  '/audit-logs/history/:entity_type/:entity_id',
  readRateLimiter,
  asyncHandler(getEntityHistoryHandler)
);

/**
 * Get single audit log by ID
 * GET /api/super-admin/audit-logs/:id
 */
router.get(
  '/audit-logs/:id',
  readRateLimiter,
  asyncHandler(getAuditLogByIdHandler)
);

/**
 * Delete audit log (SuperAdmin only)
 * DELETE /api/super-admin/audit-logs/:id
 */
router.delete(
  '/audit-logs/:id',
  writeRateLimiter,
  asyncHandler(deleteAuditLogHandler)
);

export default router;
