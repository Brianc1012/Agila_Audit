"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
exports.getAuditLogs = getAuditLogs;
exports.getAuditLogById = getAuditLogById;
exports.getEntityHistory = getEntityHistory;
exports.deleteAuditLog = deleteAuditLog;
exports.getAuditLogStats = getAuditLogStats;
exports.searchAuditLogs = searchAuditLogs;
const client_1 = __importDefault(require("../prisma/client"));
async function getNextVersion(entity_type, entity_id) {
    const lastLog = await client_1.default.audit_log.findFirst({
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
async function getActionTypeId(code) {
    const actionType = await client_1.default.action_type.findUnique({
        where: { code: code.toUpperCase() },
        select: { id: true },
    });
    if (!actionType) {
        throw new Error(`Invalid action type code: ${code}`);
    }
    return actionType.id;
}
async function createAuditLog(data) {
    const action_type_id = await getActionTypeId(data.action_type_code);
    const version = await getNextVersion(data.entity_type, data.entity_id);
    const auditLog = await client_1.default.audit_log.create({
        data: {
            entity_type: data.entity_type,
            entity_id: data.entity_id,
            action_type_id,
            action_by: data.action_by || null,
            previous_data: data.previous_data || null,
            new_data: data.new_data || null,
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
function buildAccessFilter(user) {
    const role = user.role;
    if (role === 'SuperAdmin') {
        return {};
    }
    if (role.includes('Admin')) {
        const department = role.split(' ')[0].toLowerCase();
        const deptCodes = {
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
    return {
        action_by: user.id,
    };
}
async function getAuditLogs(filters, user) {
    const { entity_type, entity_id, action_type_code, action_by, dateFrom, dateTo, page = 1, limit = 10, sortBy = 'action_at', sortOrder = 'desc', } = filters;
    const accessFilter = buildAccessFilter(user);
    const where = {
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
    if (action_type_code) {
        const actionType = await client_1.default.action_type.findUnique({
            where: { code: action_type_code.toUpperCase() },
            select: { id: true },
        });
        if (actionType) {
            where.action_type_id = actionType.id;
        }
        else {
            return { logs: [], total: 0, page, limit };
        }
    }
    const total = await client_1.default.audit_log.count({ where });
    const logs = await client_1.default.audit_log.findMany({
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
        logs: logs,
        total,
        page,
        limit,
    };
}
async function getAuditLogById(id, user) {
    const accessFilter = buildAccessFilter(user);
    const log = await client_1.default.audit_log.findFirst({
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
async function getEntityHistory(entity_type, entity_id, user) {
    const accessFilter = buildAccessFilter(user);
    const logs = await client_1.default.audit_log.findMany({
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
async function deleteAuditLog(id) {
    await client_1.default.audit_log.delete({
        where: { id },
    });
}
async function getAuditLogStats(user) {
    const accessFilter = buildAccessFilter(user);
    const [totalLogs, actionBreakdown, entityBreakdown, recentActivity] = await Promise.all([
        client_1.default.audit_log.count({ where: accessFilter }),
        client_1.default.audit_log.groupBy({
            by: ['action_type_id'],
            where: accessFilter,
            _count: {
                action_type_id: true,
            },
        }),
        client_1.default.audit_log.groupBy({
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
        client_1.default.audit_log.count({
            where: {
                ...accessFilter,
                action_at: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
            },
        }),
    ]);
    const actionTypeIds = actionBreakdown.map((item) => item.action_type_id);
    const actionTypes = await client_1.default.action_type.findMany({
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
async function searchAuditLogs(searchTerm, user, page = 1, limit = 10) {
    const accessFilter = buildAccessFilter(user);
    const where = {
        ...accessFilter,
        OR: [
            { entity_type: { contains: searchTerm, mode: 'insensitive' } },
            { entity_id: { contains: searchTerm, mode: 'insensitive' } },
            { action_by: { contains: searchTerm, mode: 'insensitive' } },
        ],
    };
    const [logs, total] = await Promise.all([
        client_1.default.audit_log.findMany({
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
        client_1.default.audit_log.count({ where }),
    ]);
    return { logs: logs, total };
}
