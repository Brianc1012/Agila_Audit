// ============================================================================
// SUMMARIES SERVICE - AGGREGATE STATISTICS
// ============================================================================

import prisma from '../prisma/client';
import { SummaryFilters, JWTUser } from '../types/auditLog';
import { applyAccessFilter } from '../middlewares/roleAccess.middleware';

/**
 * Aggregate daily audit logs into summaries
 */
export async function aggregateDailyLogs(
  date?: Date
): Promise<void> {
  const targetDate = date || new Date();
  targetDate.setHours(0, 0, 0, 0);

  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  // Get all logs for the target date
  const logs = await prisma.auditLog.findMany({
    where: {
      performedAt: {
        gte: targetDate,
        lt: nextDate,
      },
    },
    select: {
      sourceService: true,
      moduleName: true,
      action: true,
      performedBy: true,
      processingTimeMs: true,
    },
  });

  // Group by service, module, and action
  const groupedData = new Map<string, any>();

  for (const log of logs) {
    const key = `${log.sourceService}-${log.moduleName}-${log.action}`;
    
    if (!groupedData.has(key)) {
      groupedData.set(key, {
        sourceService: log.sourceService,
        moduleName: log.moduleName,
        action: log.action,
        performedBySet: new Set<string>(),
        totalCount: 0,
        processingTimes: [],
      });
    }

    const group = groupedData.get(key);
    group.totalCount++;
    group.performedBySet.add(log.performedBy);
    if (log.processingTimeMs) {
      group.processingTimes.push(log.processingTimeMs);
    }
  }

  // Create or update summaries
  for (const [key, data] of groupedData.entries()) {
    const avgProcessingTime =
      data.processingTimes.length > 0
        ? data.processingTimes.reduce((a: number, b: number) => a + b, 0) /
          data.processingTimes.length
        : null;

    await prisma.auditLogSummary.upsert({
      where: {
        date_sourceService_moduleName_action: {
          date: targetDate,
          sourceService: data.sourceService,
          moduleName: data.moduleName,
          action: data.action,
        },
      },
      update: {
        totalCount: data.totalCount,
        uniqueUsers: data.performedBySet.size,
        avgProcessingTime,
        lastAggregatedAt: new Date(),
      },
      create: {
        date: targetDate,
        sourceService: data.sourceService,
        moduleName: data.moduleName,
        action: data.action,
        totalCount: data.totalCount,
        uniqueUsers: data.performedBySet.size,
        avgProcessingTime,
      },
    });
  }
}

/**
 * Get summaries with filters
 */
export async function getSummaries(
  filters: SummaryFilters,
  user: JWTUser,
  serviceName?: string
): Promise<any[]> {
  const {
    dateFrom,
    dateTo,
    service,
    moduleName,
    action,
    groupBy = 'day',
  } = filters;

  // Apply access control
  const accessFilter = applyAccessFilter(user, serviceName);
  
  // For summaries, we filter by sourceService instead of performedBy
  const where: any = {
    ...(dateFrom &&
      dateTo && {
        date: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
      }),
    ...(service && { sourceService: service }),
    ...(moduleName && { moduleName }),
    ...(action && { action }),
  };

  // Apply service-level access control
  if (accessFilter.sourceService) {
    where.sourceService = accessFilter.sourceService;
  }

  const summaries = await prisma.auditLogSummary.findMany({
    where,
    orderBy: { date: 'desc' },
  });

  return summaries;
}

/**
 * Get summary statistics
 */
export async function getSummaryStats(
  user: JWTUser,
  serviceName?: string
): Promise<any> {
  const accessFilter = applyAccessFilter(user, serviceName);

  const where: any = {};
  if (accessFilter.sourceService) {
    where.sourceService = accessFilter.sourceService;
  }

  const [
    totalSummaries,
    totalLogsAggregated,
    serviceBreakdown,
  ] = await Promise.all([
    // Total summary records
    prisma.auditLogSummary.count({ where }),

    // Total logs aggregated
    prisma.auditLogSummary.aggregate({
      where,
      _sum: {
        totalCount: true,
      },
    }),

    // Service breakdown
    prisma.auditLogSummary.groupBy({
      by: ['sourceService'],
      where,
      _sum: {
        totalCount: true,
      },
      orderBy: {
        _sum: {
          totalCount: 'desc',
        },
      },
    }),
  ]);

  return {
    totalSummaries,
    totalLogsAggregated: totalLogsAggregated._sum.totalCount || 0,
    serviceBreakdown: serviceBreakdown.map((item) => ({
      service: item.sourceService,
      totalLogs: item._sum.totalCount || 0,
    })),
  };
}

/**
 * Get recent activity summary
 */
export async function getRecentActivity(
  days: number = 7,
  user: JWTUser,
  serviceName?: string
): Promise<any[]> {
  const accessFilter = applyAccessFilter(user, serviceName);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const where: any = {
    date: {
      gte: startDate,
    },
  };

  if (accessFilter.sourceService) {
    where.sourceService = accessFilter.sourceService;
  }

  const summaries = await prisma.auditLogSummary.findMany({
    where,
    orderBy: { date: 'desc' },
  });

  return summaries;
}

/**
 * Manual aggregation trigger (SuperAdmin only)
 */
export async function triggerManualAggregation(
  dateFrom: Date,
  dateTo: Date
): Promise<{ datesProcessed: number }> {
  const dates: Date[] = [];
  const current = new Date(dateFrom);
  current.setHours(0, 0, 0, 0);

  const end = new Date(dateTo);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  for (const date of dates) {
    await aggregateDailyLogs(date);
  }

  return { datesProcessed: dates.length };
}
