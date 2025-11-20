"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = authenticateJWT;
exports.optionalAuth = optionalAuth;
const jwt_util_1 = require("../utils/jwt.util");
const response_util_1 = require("../utils/response.util");
function authenticateJWT(req, res, next) {
    if (process.env.DISABLE_AUTH === 'true') {
        console.log('⚠️  AUTH DISABLED - Using mock user for testing');
        req.user = {
            id: process.env.TEST_USER_ID || 'test_user_001',
            username: process.env.TEST_USERNAME || 'test_admin',
            role: process.env.TEST_USER_ROLE || 'SuperAdmin'
        };
        next();
        return;
    }
    try {
        const authHeader = req.headers.authorization;
        const token = (0, jwt_util_1.extractToken)(authHeader);
        if (!token) {
            (0, response_util_1.sendUnauthorized)(res, 'No token provided');
            return;
        }
        const user = (0, jwt_util_1.verifyToken)(token);
        req.user = user;
        next();
    }
    catch (error) {
        (0, response_util_1.sendUnauthorized)(res, error.message || 'Invalid or expired token');
    }
}
function optionalAuth(req, res, next) {
    if (process.env.DISABLE_AUTH === 'true') {
        req.user = {
            id: process.env.TEST_USER_ID || 'test_user_001',
            username: process.env.TEST_USERNAME || 'test_admin',
            role: process.env.TEST_USER_ROLE || 'SuperAdmin'
        };
        next();
        return;
    }
    try {
        const authHeader = req.headers.authorization;
        const token = (0, jwt_util_1.extractToken)(authHeader);
        if (token) {
            const user = (0, jwt_util_1.verifyToken)(token);
            req.user = user;
        }
        next();
    }
    catch (error) {
        next();
    }
}
