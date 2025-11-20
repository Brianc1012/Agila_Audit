// ============================================================================
// USER ROUTES - Access to own audit logs only
// ============================================================================

import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
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

// All routes require user authentication
router.use(authenticateJWT);

/**
 * Create new audit log
 * POST /api/user/audit-logs
 */
router.post(
  '/audit-logs',
  writeRateLimiter,
  asyncHandler(createAuditLogHandler)
);

/**
 * Get own audit logs
 * GET /api/user/audit-logs
 */
router.get(
  '/audit-logs',
  readRateLimiter,
  asyncHandler(getAuditLogsHandler)
);

/**
 * Get own audit log statistics
 * GET /api/user/audit-logs/stats
 */
router.get(
  '/audit-logs/stats',
  readRateLimiter,
  asyncHandler(getAuditLogStatsHandler)
);

/**
 * Search own audit logs
 * GET /api/user/audit-logs/search
 */
router.get(
  '/audit-logs/search',
  readRateLimiter,
  asyncHandler(searchAuditLogsHandler)
);

/**
 * Get entity history (own actions only)
 * GET /api/user/audit-logs/history/:entity_type/:entity_id
 */
router.get(
  '/audit-logs/history/:entity_type/:entity_id',
  readRateLimiter,
  asyncHandler(getEntityHistoryHandler)
);

/**
 * Get single audit log by ID (own logs only)
 * GET /api/user/audit-logs/:id
 */
router.get(
  '/audit-logs/:id',
  readRateLimiter,
  asyncHandler(getAuditLogByIdHandler)
);

export default router;
