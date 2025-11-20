"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
exports.asyncHandler = asyncHandler;
const response_util_1 = require("../utils/response.util");
class AppError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function errorHandler(error, req, res, next) {
    console.error('Error:', {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        path: req.path,
        method: req.method,
    });
    if (error instanceof AppError) {
        (0, response_util_1.sendError)(res, error.message, process.env.NODE_ENV === 'development' ? error.stack : undefined, error.code, error.statusCode);
        return;
    }
    if (error.name === 'PrismaClientKnownRequestError') {
        (0, response_util_1.sendError)(res, 'Database operation failed', error.message, 'DATABASE_ERROR', 400);
        return;
    }
    if (error.name === 'PrismaClientValidationError') {
        (0, response_util_1.sendError)(res, 'Invalid data provided', error.message, 'VALIDATION_ERROR', 400);
        return;
    }
    if (error.name === 'JsonWebTokenError') {
        (0, response_util_1.sendError)(res, 'Invalid token', error.message, 'INVALID_TOKEN', 401);
        return;
    }
    if (error.name === 'TokenExpiredError') {
        (0, response_util_1.sendError)(res, 'Token expired', error.message, 'TOKEN_EXPIRED', 401);
        return;
    }
    (0, response_util_1.sendError)(res, 'Internal server error', process.env.NODE_ENV === 'development' ? error.message : undefined, 'INTERNAL_ERROR', 500);
}
function notFoundHandler(req, res) {
    (0, response_util_1.sendError)(res, `Route ${req.method} ${req.path} not found`, undefined, 'NOT_FOUND', 404);
}
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
