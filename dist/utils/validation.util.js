"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateAuditLog = validateCreateAuditLog;
exports.isValidDate = isValidDate;
exports.validatePagination = validatePagination;
exports.sanitizeFilters = sanitizeFilters;
exports.isSuperAdmin = isSuperAdmin;
exports.isDepartmentAdmin = isDepartmentAdmin;
exports.extractDepartmentFromRole = extractDepartmentFromRole;
exports.extractDepartmentFromUserId = extractDepartmentFromUserId;
function validateCreateAuditLog(data) {
    const errors = [];
    if (!data.entity_type || typeof data.entity_type !== 'string') {
        errors.push('entity_type is required and must be a string');
    }
    if (!data.entity_id || typeof data.entity_id !== 'string') {
        errors.push('entity_id is required and must be a string');
    }
    if (!data.action_type_code || typeof data.action_type_code !== 'string') {
        errors.push('action_type_code is required and must be a string (e.g., CREATE, UPDATE, DELETE)');
    }
    if (data.action_by && typeof data.action_by !== 'string') {
        errors.push('action_by must be a string');
    }
    if (data.previous_data && typeof data.previous_data !== 'object') {
        errors.push('previous_data must be an object');
    }
    if (data.new_data && typeof data.new_data !== 'object') {
        errors.push('new_data must be an object');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString))
        return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}
function validatePagination(page, limit) {
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
    return { page: validPage, limit: validLimit };
}
function sanitizeFilters(filters) {
    return {
        ...(filters.entity_type && { entity_type: String(filters.entity_type) }),
        ...(filters.entity_id && { entity_id: String(filters.entity_id) }),
        ...(filters.action_type_code && { action_type_code: String(filters.action_type_code) }),
        ...(filters.action_by && { action_by: String(filters.action_by) }),
        ...(filters.dateFrom && isValidDate(filters.dateFrom) && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && isValidDate(filters.dateTo) && { dateTo: filters.dateTo }),
        ...validatePagination(filters.page, filters.limit),
        ...(filters.sortBy && { sortBy: String(filters.sortBy) }),
        ...(filters.sortOrder && ['asc', 'desc'].includes(filters.sortOrder) && {
            sortOrder: filters.sortOrder,
        }),
    };
}
function isSuperAdmin(role) {
    return role === 'SuperAdmin';
}
function isDepartmentAdmin(role) {
    return role.includes('Admin') && !isSuperAdmin(role);
}
function extractDepartmentFromRole(role) {
    const match = role.match(/^(\w+)\s+(Admin|Non-Admin)$/i);
    return match ? match[1].toLowerCase() : null;
}
function extractDepartmentFromUserId(userId) {
    const deptCodes = {
        'FIN': 'finance',
        'HR': 'hr',
        'INV': 'inventory',
        'OPS': 'operations',
        'ADM': 'admin',
    };
    const match = userId.match(/^([A-Z]+)-/);
    if (match && deptCodes[match[1]]) {
        return deptCodes[match[1]];
    }
    return null;
}
