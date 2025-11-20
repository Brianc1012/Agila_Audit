"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyAccessFilter = applyAccessFilter;
exports.enforceRoleAccess = enforceRoleAccess;
exports.requireSuperAdmin = requireSuperAdmin;
exports.requireDepartmentAdmin = requireDepartmentAdmin;
const response_util_1 = require("../utils/response.util");
const validation_util_1 = require("../utils/validation.util");
function applyAccessFilter(user, serviceName) {
    if ((0, validation_util_1.isSuperAdmin)(user.role)) {
        return {};
    }
    if ((0, validation_util_1.isDepartmentAdmin)(user.role)) {
        const department = (0, validation_util_1.extractDepartmentFromRole)(user.role);
        const deptCodes = {
            'finance': 'FIN',
            'hr': 'HR',
            'inventory': 'INV',
            'operations': 'OPS',
        };
        const deptCode = deptCodes[department || ''];
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
function enforceRoleAccess(req, res, next) {
    if (process.env.DISABLE_AUTH === 'true') {
        console.log('⚠️  ROLE ACCESS CONTROL DISABLED - Bypassing for testing');
        next();
        return;
    }
    try {
        if (!req.user) {
            (0, response_util_1.sendUnauthorized)(res, 'Authentication required');
            return;
        }
        next();
    }
    catch (error) {
        console.error('Role access enforcement error:', error);
        (0, response_util_1.sendForbidden)(res, 'Access control check failed');
    }
}
function requireSuperAdmin(req, res, next) {
    if (process.env.DISABLE_AUTH === 'true') {
        console.log('⚠️  SUPERADMIN CHECK DISABLED - Bypassing for testing');
        next();
        return;
    }
    if (!req.user) {
        (0, response_util_1.sendUnauthorized)(res, 'Authentication required');
        return;
    }
    if (!(0, validation_util_1.isSuperAdmin)(req.user.role)) {
        (0, response_util_1.sendForbidden)(res, 'SuperAdmin access required');
        return;
    }
    next();
}
function requireDepartmentAdmin(req, res, next) {
    if (process.env.DISABLE_AUTH === 'true') {
        console.log('⚠️  DEPARTMENT ADMIN CHECK DISABLED - Bypassing for testing');
        next();
        return;
    }
    if (!req.user) {
        (0, response_util_1.sendUnauthorized)(res, 'Authentication required');
        return;
    }
    if (!(0, validation_util_1.isSuperAdmin)(req.user.role) && !(0, validation_util_1.isDepartmentAdmin)(req.user.role)) {
        (0, response_util_1.sendForbidden)(res, 'Department Admin access required');
        return;
    }
    next();
}
