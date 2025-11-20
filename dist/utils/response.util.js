"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
exports.sendNotFound = sendNotFound;
exports.sendUnauthorized = sendUnauthorized;
exports.sendForbidden = sendForbidden;
function sendSuccess(res, message, data, meta, statusCode = 200) {
    const response = {
        success: true,
        message,
        ...(data !== undefined && { data }),
        ...(meta && { meta }),
    };
    return res.status(statusCode).json(response);
}
function sendError(res, message, error, code, statusCode = 400) {
    const response = {
        success: false,
        message,
        ...(error && { error }),
        ...(code && { code }),
    };
    return res.status(statusCode).json(response);
}
function sendNotFound(res, message = 'Resource not found') {
    return sendError(res, message, undefined, 'NOT_FOUND', 404);
}
function sendUnauthorized(res, message = 'Unauthorized access') {
    return sendError(res, message, undefined, 'UNAUTHORIZED', 401);
}
function sendForbidden(res, message = 'Access forbidden') {
    return sendError(res, message, undefined, 'FORBIDDEN', 403);
}
