// ============================================================================
// AUDIT LOGS ROUTES
// ============================================================================

import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import {
  validateApiKeyMiddleware,
  requireWritePermission,
} from '../middlewares/apiKey.middleware';
import {
  enforceRoleAccess,
  requireSuperAdmin,
} from '../middlewares/roleAccess.middleware';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import {
  readRateLimiter,
  writeRateLimiter,
} from '../middlewares/rateLimit.middleware';
import {
  createAuditLogHandler,
  getAuditLogsHandler,
  getAuditLogByIdHandler,
  deleteAuditLogHandler,
  getAuditLogStatsHandler,
  searchAuditLogsHandler,
} from '../controllers/auditLogs.controller';

const router = Router();

/**
 * Create new audit log (requires valid API key with write permission)
 * POST /api/audit-logs
 */
router.post(
  '/',
  writeRateLimiter,
  requireWritePermission,
  asyncHandler(createAuditLogHandler)
);

/**
 * Get audit logs with filters (requires JWT and role-based access)
 * GET /api/audit-logs
 */
router.get(
  '/',
  readRateLimiter,
  authenticateJWT,
  enforceRoleAccess,
  asyncHandler(getAuditLogsHandler)
);

/**
 * Get audit log statistics
 * GET /api/audit-logs/stats
 */
router.get(
  '/stats',
  readRateLimiter,
  authenticateJWT,
  enforceRoleAccess,
  asyncHandler(getAuditLogStatsHandler)
);

/**
 * Search audit logs
 * GET /api/audit-logs/search
 */
router.get(
  '/search',
  readRateLimiter,
  authenticateJWT,
  enforceRoleAccess,
  asyncHandler(searchAuditLogsHandler)
);

/**
 * Get single audit log by ID (requires JWT and role-based access)
 * GET /api/audit-logs/:id
 */
router.get(
  '/:id',
  readRateLimiter,
  authenticateJWT,
  enforceRoleAccess,
  asyncHandler(getAuditLogByIdHandler)
);

/**
 * Delete audit log (SuperAdmin only)
 * DELETE /api/audit-logs/:id
 */
router.delete(
  '/:id',
  writeRateLimiter,
  authenticateJWT,
  requireSuperAdmin,
  asyncHandler(deleteAuditLogHandler)
);

export default router;
