// ============================================================================
// SUMMARIES ROUTES
// ============================================================================

import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import {
  enforceRoleAccess,
  requireSuperAdmin,
  requireDepartmentAdmin,
} from '../middlewares/roleAccess.middleware';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { readRateLimiter, writeRateLimiter } from '../middlewares/rateLimit.middleware';
import {
  getSummariesHandler,
  getSummaryStatsHandler,
  getRecentActivityHandler,
  triggerAggregationHandler,
} from '../controllers/summaries.controller';

const router = Router();

/**
 * Get audit log summaries
 * GET /api/summaries
 */
router.get(
  '/',
  readRateLimiter,
  authenticateJWT,
  requireDepartmentAdmin,
  asyncHandler(getSummariesHandler)
);

/**
 * Get summary statistics
 * GET /api/summaries/stats
 */
router.get(
  '/stats',
  readRateLimiter,
  authenticateJWT,
  requireDepartmentAdmin,
  asyncHandler(getSummaryStatsHandler)
);

/**
 * Get recent activity
 * GET /api/summaries/recent
 */
router.get(
  '/recent',
  readRateLimiter,
  authenticateJWT,
  enforceRoleAccess,
  asyncHandler(getRecentActivityHandler)
);

/**
 * Manually trigger aggregation (SuperAdmin only)
 * POST /api/summaries/aggregate
 */
router.post(
  '/aggregate',
  writeRateLimiter,
  authenticateJWT,
  requireSuperAdmin,
  asyncHandler(triggerAggregationHandler)
);

export default router;
