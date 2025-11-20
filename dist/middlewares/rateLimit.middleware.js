"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readRateLimiter = exports.writeRateLimiter = exports.apiRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: WINDOW_MS,
    max: MAX_REQUESTS,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return req.user?.role === 'SuperAdmin';
    },
});
exports.writeRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: WINDOW_MS,
    max: Math.floor(MAX_REQUESTS / 2),
    message: {
        success: false,
        message: 'Too many write requests, please try again later',
        code: 'WRITE_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.readRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: WINDOW_MS,
    max: MAX_REQUESTS * 2,
    message: {
        success: false,
        message: 'Too many read requests, please try again later',
        code: 'READ_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
