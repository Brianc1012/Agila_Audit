"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLogHandler = createAuditLogHandler;
exports.getAuditLogsHandler = getAuditLogsHandler;
exports.getAuditLogByIdHandler = getAuditLogByIdHandler;
exports.deleteAuditLogHandler = deleteAuditLogHandler;
exports.getAuditLogStatsHandler = getAuditLogStatsHandler;
exports.searchAuditLogsHandler = searchAuditLogsHandler;
exports.getEntityHistoryHandler = getEntityHistoryHandler;
const response_util_1 = require("../utils/response.util");
const validation_util_1 = require("../utils/validation.util");
const auditLogs_service_1 = require("../services/auditLogs.service");
async function createAuditLogHandler(req, res) {
    try {
        const validation = (0, validation_util_1.validateCreateAuditLog)(req.body);
        if (!validation.isValid) {
            (0, response_util_1.sendError)(res, 'Validation failed', validation.errors.join(', '));
            return;
        }
        const auditLog = await (0, auditLogs_service_1.createAuditLog)(req.body);
        (0, response_util_1.sendSuccess)(res, 'Audit log created successfully', auditLog, undefined, 201);
    }
    catch (error) {
        console.error('Create audit log error:', error);
        (0, response_util_1.sendError)(res, 'Failed to create audit log', error.message, undefined, 500);
    }
}
async function getAuditLogsHandler(req, res) {
    try {
        if (!req.user) {
            (0, response_util_1.sendError)(res, 'User authentication required', undefined, undefined, 401);
            return;
        }
        const filters = (0, validation_util_1.sanitizeFilters)(req.query);
        const result = await (0, auditLogs_service_1.getAuditLogs)(filters, req.user);
        (0, response_util_1.sendSuccess)(res, 'Audit logs retrieved successfully', result.logs, {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / result.limit),
        });
    }
    catch (error) {
        console.error('Get audit logs error:', error);
        (0, response_util_1.sendError)(res, 'Failed to retrieve audit logs', error.message, undefined, 500);
    }
}
async function getAuditLogByIdHandler(req, res) {
    try {
        if (!req.user) {
            (0, response_util_1.sendError)(res, 'User authentication required', undefined, undefined, 401);
            return;
        }
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            (0, response_util_1.sendError)(res, 'Invalid audit log ID');
            return;
        }
        const log = await (0, auditLogs_service_1.getAuditLogById)(id, req.user);
        if (!log) {
            (0, response_util_1.sendNotFound)(res, 'Audit log not found or access denied');
            return;
        }
        (0, response_util_1.sendSuccess)(res, 'Audit log retrieved successfully', log);
    }
    catch (error) {
        console.error('Get audit log by ID error:', error);
        (0, response_util_1.sendError)(res, 'Failed to retrieve audit log', error.message, undefined, 500);
    }
}
async function deleteAuditLogHandler(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            (0, response_util_1.sendError)(res, 'Invalid audit log ID');
            return;
        }
        await (0, auditLogs_service_1.deleteAuditLog)(id);
        (0, response_util_1.sendSuccess)(res, 'Audit log deleted successfully');
    }
    catch (error) {
        console.error('Delete audit log error:', error);
        (0, response_util_1.sendError)(res, 'Failed to delete audit log', error.message, undefined, 500);
    }
}
async function getAuditLogStatsHandler(req, res) {
    try {
        if (!req.user) {
            (0, response_util_1.sendError)(res, 'User authentication required', undefined, undefined, 401);
            return;
        }
        const stats = await (0, auditLogs_service_1.getAuditLogStats)(req.user);
        (0, response_util_1.sendSuccess)(res, 'Statistics retrieved successfully', stats);
    }
    catch (error) {
        console.error('Get stats error:', error);
        (0, response_util_1.sendError)(res, 'Failed to retrieve statistics', error.message, undefined, 500);
    }
}
async function searchAuditLogsHandler(req, res) {
    try {
        if (!req.user) {
            (0, response_util_1.sendError)(res, 'User authentication required', undefined, undefined, 401);
            return;
        }
        const searchTerm = req.query.q;
        if (!searchTerm) {
            (0, response_util_1.sendError)(res, 'Search term is required');
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await (0, auditLogs_service_1.searchAuditLogs)(searchTerm, req.user, page, limit);
        (0, response_util_1.sendSuccess)(res, 'Search completed successfully', result.logs, {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        });
    }
    catch (error) {
        console.error('Search audit logs error:', error);
        (0, response_util_1.sendError)(res, 'Failed to search audit logs', error.message, undefined, 500);
    }
}
async function getEntityHistoryHandler(req, res) {
    try {
        if (!req.user) {
            (0, response_util_1.sendError)(res, 'User authentication required', undefined, undefined, 401);
            return;
        }
        const { entity_type, entity_id } = req.params;
        if (!entity_type || !entity_id) {
            (0, response_util_1.sendError)(res, 'entity_type and entity_id are required');
            return;
        }
        const history = await (0, auditLogs_service_1.getEntityHistory)(entity_type, entity_id, req.user);
        (0, response_util_1.sendSuccess)(res, 'Entity history retrieved successfully', history);
    }
    catch (error) {
        console.error('Get entity history error:', error);
        (0, response_util_1.sendError)(res, 'Failed to retrieve entity history', error.message, undefined, 500);
    }
}
