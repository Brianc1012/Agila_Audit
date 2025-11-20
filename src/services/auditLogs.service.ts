// ============================================================================
// AUDIT LOGS SERVICE - CORE BUSINESS LOGIC (Updated for new schema)
// ============================================================================

import prisma from '../prisma/client';
import {
  CreateAuditLogDTO,
  AuditLogFilters,
  JWTUser,
  AuditLogResponse,
} from '../types/auditLog';

/**
 * Get the next version number for an entity
 */
async function getNextVersion(entity_type: string, entity_id: string): Promise<number> {
  const lastLog = await prisma.audit_log.findFirst({
    where: {
      entity_type,
      entity_id,
    },
    orderBy: {
      version: 'desc',
    },
    select: {
      version: true,
    },
  });

  return lastLog ? lastLog.version + 1 : 1;
}

/**
 * Get action_type_id from code
 */
async function getActionTypeId(code: string): Promise<number> {
  const actionType = await prisma.action_type.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true },
  });

  if (!actionType) {
    throw new Error(`Invalid action type code: ${code}`);
  }

  return actionType.id;
}

/**
 * Create a new audit log entry
 */
export async function createAuditLog(
  data: CreateAuditLogDTO
): Promise<AuditLogResponse> {
  // Get action_type_id from code
  const action_type_id = await getActionTypeId(data.action_type_code);

  // Get next version for this entity
  const version = await getNextVersion(data.entity_type, data.entity_id);

  // Create the audit log
  const auditLog = await prisma.audit_log.create({
    data: {
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      action_type_id,
      action_by: data.action_by || null,
      previous_data: data.previous_data || undefined,
      new_data: data.new_data || undefined,
      version,
    },
    include: {
      action_type: {
        select: {
          id: true,
          code: true,
          description: true,
        },
      },
    },
  });

  return auditLog;
}

/**
 * Build access filter based on user role
 */
function buildAccessFilter(user: JWTUser): any {
  const role = user.role;

  // SuperAdmin - No restrictions
  if (role === 'SuperAdmin') {
    return {};
  }

  // Department Admin - Can see all logs from their department users
  if (role.includes('Admin')) {
    const department = role.split(' ')[0].toLowerCase();
    
    // Filter by action_by that starts with department code
    // This assumes user IDs follow pattern: FIN-YYYYMMDD-XXX
    const deptCodes: Record<string, string> = {
      'finance': 'FIN',
      'hr': 'HR',
      'inventory': 'INV',
      'operations': 'OPS',
    };

    const deptCode = deptCodes[department];
    if (deptCode) {
      return {
        action_by: {
          startsWith: deptCode,
        },
      };
    }
  }

  // Regular user - Can only see their own logs
  return {
    action_by: user.id,
  };
}

/**
 * Get audit logs with filters and access control
 */
export async function getAuditLogs(
  filters: AuditLogFilters,
  user: JWTUser
): Promise<{ logs: AuditLogResponse[]; total: number; page: number; limit: number }> {
  const {
    entity_type,
    entity_id,
    action_type_code,
    action_by,
    dateFrom,
    dateTo,
    page = 1,
    limit = 10,
    sortBy = 'action_at',
    sortOrder = 'desc',
  } = filters;

  // Apply access control filter
  const accessFilter = buildAccessFilter(user);

  // Build where clause
  const where: any = {
    ...accessFilter,
    ...(entity_type && { entity_type }),
    ...(entity_id && { entity_id }),
    ...(action_by && { action_by }),
    ...(dateFrom &&
      dateTo && {
        action_at: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo + 'T23:59:59.999Z'),
        },
      }),
    ...(dateFrom &&
      !dateTo && {
        action_at: {
          gte: new Date(dateFrom),
        },
      }),
    ...(!dateFrom &&
      dateTo && {
        action_at: {
          lte: new Date(dateTo + 'T23:59:59.999Z'),
        },
      }),
  };

  // Add action_type_code filter if provided
  if (action_type_code) {
    const actionType = await prisma.action_type.findUnique({
      where: { code: action_type_code.toUpperCase() },
      select: { id: true },
    });

    if (actionType) {
      where.action_type_id = actionType.id;
    } else {
      // Return empty result if invalid action type code
      return { logs: [], total: 0, page, limit };
    }
  }

  // Get total count
  const total = await prisma.audit_log.count({ where });

  // Get paginated results
  const logs = await prisma.audit_log.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      action_type: {
        select: {
          id: true,
          code: true,
          description: true,
        },
      },
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
  user: JWTUser
): Promise<AuditLogResponse | null> {
  const accessFilter = buildAccessFilter(user);

  const log = await prisma.audit_log.findFirst({
    where: {
      id,
      ...accessFilter,
    },
    include: {
      action_type: {
        select: {
          id: true,
          code: true,
          description: true,
        },
      },
    },
  });

  return log;
}

/**
 * Get audit log history for a specific entity
 */
export async function getEntityHistory(
  entity_type: string,
  entity_id: string,
  user: JWTUser
): Promise<AuditLogResponse[]> {
  const accessFilter = buildAccessFilter(user);

  const logs = await prisma.audit_log.findMany({
    where: {
      entity_type,
      entity_id,
      ...accessFilter,
    },
    orderBy: {
      version: 'asc',
    },
    include: {
      action_type: {
        select: {
          id: true,
          code: true,
          description: true,
        },
      },
    },
  });

  return logs;
}

/**
 * Delete an audit log (SuperAdmin only)
 */
export async function deleteAuditLog(id: number): Promise<void> {
  await prisma.audit_log.delete({
    where: { id },
  });
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(user: JWTUser): Promise<any> {
  const accessFilter = buildAccessFilter(user);

  const [totalLogs, actionBreakdown, entityBreakdown, recentActivity] = await Promise.all([
    // Total logs
    prisma.audit_log.count({ where: accessFilter }),

    // Action breakdown
    prisma.audit_log.groupBy({
      by: ['action_type_id'],
      where: accessFilter,
      _count: {
        action_type_id: true,
      },
    }),

    // Entity type breakdown
    prisma.audit_log.groupBy({
      by: ['entity_type'],
      where: accessFilter,
      _count: {
        entity_type: true,
      },
      orderBy: {
        _count: {
          entity_type: 'desc',
        },
      },
    }),

    // Recent activity (last 24 hours)
    prisma.audit_log.count({
      where: {
        ...accessFilter,
        action_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  // Get action type details for breakdown
  const actionTypeIds = actionBreakdown.map((item) => item.action_type_id);
  const actionTypes = await prisma.action_type.findMany({
    where: {
      id: { in: actionTypeIds },
    },
    select: {
      id: true,
      code: true,
      description: true,
    },
  });

  const actionTypeMap = new Map(actionTypes.map((at) => [at.id, at]));

  return {
    totalLogs,
    recentActivity,
    actionBreakdown: actionBreakdown.map((item) => ({
      action_type: actionTypeMap.get(item.action_type_id),
      count: item._count.action_type_id,
    })),
    entityBreakdown: entityBreakdown.map((item) => ({
      entity_type: item.entity_type,
      count: item._count.entity_type,
    })),
  };
}

/**
 * Search audit logs by text
 */
export async function searchAuditLogs(
  searchTerm: string,
  user: JWTUser,
  page: number = 1,
  limit: number = 10
): Promise<{ logs: AuditLogResponse[]; total: number }> {
  const accessFilter = buildAccessFilter(user);

  const where = {
    ...accessFilter,
    OR: [
      { entity_type: { contains: searchTerm, mode: 'insensitive' as any } },
      { entity_id: { contains: searchTerm, mode: 'insensitive' as any } },
      { action_by: { contains: searchTerm, mode: 'insensitive' as any } },
    ],
  };

  const [logs, total] = await Promise.all([
    prisma.audit_log.findMany({
      where,
      orderBy: { action_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        action_type: {
          select: {
            id: true,
            code: true,
            description: true,
          },
        },
      },
    }),
    prisma.audit_log.count({ where }),
  ]);

  return { logs, total };
}
