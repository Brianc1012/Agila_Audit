"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateDailyLogs = aggregateDailyLogs;
exports.getSummaries = getSummaries;
exports.getSummaryStats = getSummaryStats;
exports.getRecentActivity = getRecentActivity;
exports.triggerManualAggregation = triggerManualAggregation;
const client_1 = __importDefault(require("../prisma/client"));
const roleAccess_middleware_1 = require("../middlewares/roleAccess.middleware");
async function aggregateDailyLogs(date) {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const logs = await client_1.default.auditLog.findMany({
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
    const groupedData = new Map();
    for (const log of logs) {
        const key = `${log.sourceService}-${log.moduleName}-${log.action}`;
        if (!groupedData.has(key)) {
            groupedData.set(key, {
                sourceService: log.sourceService,
                moduleName: log.moduleName,
                action: log.action,
                performedBySet: new Set(),
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
    for (const [key, data] of groupedData.entries()) {
        const avgProcessingTime = data.processingTimes.length > 0
            ? data.processingTimes.reduce((a, b) => a + b, 0) /
                data.processingTimes.length
            : null;
        await client_1.default.auditLogSummary.upsert({
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
async function getSummaries(filters, user, serviceName) {
    const { dateFrom, dateTo, service, moduleName, action, groupBy = 'day', } = filters;
    const accessFilter = (0, roleAccess_middleware_1.applyAccessFilter)(user, serviceName);
    const where = {
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
    if (accessFilter.sourceService) {
        where.sourceService = accessFilter.sourceService;
    }
    const summaries = await client_1.default.auditLogSummary.findMany({
        where,
        orderBy: { date: 'desc' },
    });
    return summaries;
}
async function getSummaryStats(user, serviceName) {
    const accessFilter = (0, roleAccess_middleware_1.applyAccessFilter)(user, serviceName);
    const where = {};
    if (accessFilter.sourceService) {
        where.sourceService = accessFilter.sourceService;
    }
    const [totalSummaries, totalLogsAggregated, serviceBreakdown,] = await Promise.all([
        client_1.default.auditLogSummary.count({ where }),
        client_1.default.auditLogSummary.aggregate({
            where,
            _sum: {
                totalCount: true,
            },
        }),
        client_1.default.auditLogSummary.groupBy({
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
async function getRecentActivity(days = 7, user, serviceName) {
    const accessFilter = (0, roleAccess_middleware_1.applyAccessFilter)(user, serviceName);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    const where = {
        date: {
            gte: startDate,
        },
    };
    if (accessFilter.sourceService) {
        where.sourceService = accessFilter.sourceService;
    }
    const summaries = await client_1.default.auditLogSummary.findMany({
        where,
        orderBy: { date: 'desc' },
    });
    return summaries;
}
async function triggerManualAggregation(dateFrom, dateTo) {
    const dates = [];
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
