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

    const summaries = await getSummaries(filters, req.user, req.serviceName);

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

    const stats = await getSummaryStats(req.user, req.serviceName);

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

    const activity = await getRecentActivity(days, req.user, req.serviceName);

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
