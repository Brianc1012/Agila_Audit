// ============================================================================
// AUDIT LOGS SERVICE - CORE BUSINESS LOGIC
// ============================================================================

import prisma from '../prisma/client';
import {
  CreateAuditLogDTO,
  AuditLogFilters,
  JWTUser,
} from '../types/auditLog';
import { applyAccessFilter } from '../middlewares/roleAccess.middleware';

/**
 * Create a new audit log entry
 */
export async function createAuditLog(
  data: CreateAuditLogDTO,
  sourceService: string,
  apiKeyId?: number
): Promise<any> {
  // Convert objects to JSON strings if needed
  const oldValues =
    typeof data.oldValues === 'object'
      ? JSON.stringify(data.oldValues)
      : data.oldValues;

  const newValues =
    typeof data.newValues === 'object'
      ? JSON.stringify(data.newValues)
      : data.newValues;

  const changedFields =
    typeof data.changedFields === 'object'
      ? JSON.stringify(data.changedFields)
      : data.changedFields;

  const metadata =
    typeof data.metadata === 'object'
      ? JSON.stringify(data.metadata)
      : data.metadata;

  const auditLog = await prisma.auditLog.create({
    data: {
      sourceService,
      moduleName: data.moduleName,
      recordId: data.recordId,
      recordCode: data.recordCode,
      action: data.action,
      performedBy: data.performedBy,
      performedByName: data.performedByName,
      performedByRole: data.performedByRole,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      requestMethod: data.requestMethod,
      requestPath: data.requestPath,
      oldValues,
      newValues,
      changedFields,
      reason: data.reason,
      metadata,
      processingTimeMs: data.processingTimeMs,
      apiKeyId,
    },
  });

  return auditLog;
}

/**
 * Get audit logs with filters and access control
 */
export async function getAuditLogs(
  filters: AuditLogFilters,
  user: JWTUser,
  serviceName?: string
): Promise<{ logs: any[]; total: number; page: number; limit: number }> {
  const {
    userId,
    service,
    moduleName,
    action,
    dateFrom,
    dateTo,
    page = 1,
    limit = 10,
    sortBy = 'performedAt',
    sortOrder = 'desc',
  } = filters;

  // Apply access control filter
  const accessFilter = applyAccessFilter(user, serviceName);

  // Build where clause
  const where: any = {
    ...accessFilter,
    ...(userId && { performedBy: userId }),
    ...(service && { sourceService: service }),
    ...(moduleName && { moduleName }),
    ...(action && { action }),
    ...(dateFrom &&
      dateTo && {
        performedAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo + 'T23:59:59.999Z'),
        },
      }),
    ...(dateFrom &&
      !dateTo && {
        performedAt: {
          gte: new Date(dateFrom),
        },
      }),
    ...(!dateFrom &&
      dateTo && {
        performedAt: {
          lte: new Date(dateTo + 'T23:59:59.999Z'),
        },
      }),
  };

  // Get total count
  const total = await prisma.auditLog.count({ where });

  // Get paginated results
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      sourceService: true,
      moduleName: true,
      recordId: true,
      recordCode: true,
      action: true,
      performedBy: true,
      performedByName: true,
      performedByRole: true,
      performedAt: true,
      ipAddress: true,
      userAgent: true,
      requestMethod: true,
      requestPath: true,
      oldValues: true,
      newValues: true,
      changedFields: true,
      reason: true,
      metadata: true,
      processingTimeMs: true,
    },
  });

  return {
    logs,
    total,
    page,
    limit,
  };
}

/**
 * Get single audit log by ID with access control
 */
export async function getAuditLogById(
  id: number,
  user: JWTUser,
  serviceName?: string
): Promise<any | null> {
  const accessFilter = applyAccessFilter(user, serviceName);

  const log = await prisma.auditLog.findFirst({
    where: {
      id,
      ...accessFilter,
    },
  });

  return log;
}

/**
 * Soft delete an audit log (SuperAdmin only)
 */
export async function deleteAuditLog(id: number): Promise<void> {
  // In this implementation, we'll actually delete the log
  // You could add a 'deletedAt' field to soft delete instead
  await prisma.auditLog.delete({
    where: { id },
  });
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(
  user: JWTUser,
  serviceName?: string
): Promise<any> {
  const accessFilter = applyAccessFilter(user, serviceName);

  const [totalLogs, actionBreakdown, serviceBreakdown] = await Promise.all([
    // Total logs
    prisma.auditLog.count({ where: accessFilter }),

    // Action breakdown
    prisma.auditLog.groupBy({
      by: ['action'],
      where: accessFilter,
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
    }),

    // Service breakdown
    prisma.auditLog.groupBy({
      by: ['sourceService'],
      where: accessFilter,
      _count: {
        sourceService: true,
      },
      orderBy: {
        _count: {
          sourceService: 'desc',
        },
      },
    }),
  ]);

  return {
    totalLogs,
    actionBreakdown: actionBreakdown.map((item) => ({
      action: item.action,
      count: item._count.action,
    })),
    serviceBreakdown: serviceBreakdown.map((item) => ({
      service: item.sourceService,
      count: item._count.sourceService,
    })),
  };
}

/**
 * Search audit logs by text
 */
export async function searchAuditLogs(
  searchTerm: string,
  user: JWTUser,
  serviceName?: string,
  page: number = 1,
  limit: number = 10
): Promise<{ logs: any[]; total: number }> {
  const accessFilter = applyAccessFilter(user, serviceName);

  const where = {
    ...accessFilter,
    OR: [
      { performedByName: { contains: searchTerm, mode: 'insensitive' as any } },
      { moduleName: { contains: searchTerm, mode: 'insensitive' as any } },
      { recordId: { contains: searchTerm, mode: 'insensitive' as any } },
      { recordCode: { contains: searchTerm, mode: 'insensitive' as any } },
      { action: { contains: searchTerm, mode: 'insensitive' as any } },
    ],
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { performedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}
