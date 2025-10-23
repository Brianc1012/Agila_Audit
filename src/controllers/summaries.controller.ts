// ============================================================================
// SUMMARIES CONTROLLER - AGGREGATE STATISTICS REQUEST HANDLERS
// ============================================================================

import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auditLog';
import {
  sendSuccess,
  sendError,
} from '../utils/response.util';
import {
  getSummaries,
  getSummaryStats,
  getRecentActivity,
  triggerManualAggregation,
} from '../services/summaries.service';
import cache from '../utils/cache.util';

/**
 * Get audit log summaries with filters
 * GET /api/summaries
 */
export async function getSummariesHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User authentication required', undefined, undefined, 401);
      return;
    }

    const filters = {
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      service: req.query.service as string,
      moduleName: req.query.moduleName as string,
      action: req.query.action as string,
      groupBy: (req.query.groupBy as 'day' | 'week' | 'month') || 'day',
    };

    // Generate cache key with user role and filters
    const cacheKey = cache.generateUserCacheKey('summaries', req.user!.id, req.user!.role, {
      ...filters,
      serviceName: req.serviceName,
    });

    // Try cache first, then fetch from DB if miss
    const summaries = await cache.withCache(
      cacheKey,
      () => getSummaries(filters, req.user!, req.serviceName),
      300 // 5 minutes TTL
    );

    sendSuccess(res, 'Summaries retrieved successfully', summaries);
  } catch (error: any) {
    console.error('Get summaries error:', error);
    sendError(res, 'Failed to retrieve summaries', error.message, undefined, 500);
  }
}

/**
 * Get summary statistics
 * GET /api/summaries/stats
 */
export async function getSummaryStatsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User authentication required', undefined, undefined, 401);
      return;
    }

    // Generate cache key with user role
    const cacheKey = cache.generateUserCacheKey('stats', req.user!.id, req.user!.role, {
      serviceName: req.serviceName,
    });

    // Try cache first, then fetch from DB if miss
    const stats = await cache.withCache(
      cacheKey,
      () => getSummaryStats(req.user!, req.serviceName),
      180 // 3 minutes TTL
    );

    sendSuccess(res, 'Summary statistics retrieved successfully', stats);
  } catch (error: any) {
    console.error('Get summary stats error:', error);
    sendError(res, 'Failed to retrieve summary statistics', error.message, undefined, 500);
  }
}

/**
 * Get recent activity summary
 * GET /api/summaries/recent
 */
export async function getRecentActivityHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User authentication required', undefined, undefined, 401);
      return;
    }

    const days = parseInt(req.query.days as string) || 7;

    // Generate cache key with user role and days parameter
    const cacheKey = cache.generateUserCacheKey('recent', req.user!.id, req.user!.role, {
      days,
      serviceName: req.serviceName,
    });

    // Try cache first, then fetch from DB if miss
    const activity = await cache.withCache(
      cacheKey,
      () => getRecentActivity(days, req.user!, req.serviceName),
      120 // 2 minutes TTL
    );

    sendSuccess(res, 'Recent activity retrieved successfully', activity);
  } catch (error: any) {
    console.error('Get recent activity error:', error);
    sendError(res, 'Failed to retrieve recent activity', error.message, undefined, 500);
  }
}

/**
 * Manually trigger aggregation (SuperAdmin only)
 * POST /api/summaries/aggregate
 */
export async function triggerAggregationHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.body;

    if (!dateFrom || !dateTo) {
      sendError(res, 'dateFrom and dateTo are required');
      return;
    }

    const result = await triggerManualAggregation(
      new Date(dateFrom),
      new Date(dateTo)
    );

    // Invalidate all summaries cache after manual aggregation
    await cache.invalidateSummaries();
    await cache.invalidateStats();

    sendSuccess(
      res,
      `Aggregation completed for ${result.datesProcessed} days`,
      result
    );
  } catch (error: any) {
    console.error('Trigger aggregation error:', error);
    sendError(res, 'Failed to trigger aggregation', error.message, undefined, 500);
  }
}
