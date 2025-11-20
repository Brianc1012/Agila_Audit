"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateApiKeyMiddleware = validateApiKeyMiddleware;
exports.requireWritePermission = requireWritePermission;
const response_util_1 = require("../utils/response.util");
const apiKeys_service_1 = require("../services/apiKeys.service");
async function validateApiKeyMiddleware(req, res, next) {
    if (process.env.DISABLE_AUTH === 'true') {
        console.log('⚠️  API KEY AUTH DISABLED - Using mock service for testing');
        req.serviceName = process.env.TEST_SERVICE_NAME || 'finance';
        req.apiKeyId = 1;
        next();
        return;
    }
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            (0, response_util_1.sendUnauthorized)(res, 'API key is required');
            return;
        }
        const validation = await (0, apiKeys_service_1.validateApiKey)(apiKey);
        if (!validation.isValid || !validation.apiKey) {
            (0, response_util_1.sendUnauthorized)(res, validation.error || 'Invalid API key');
            return;
        }
        req.serviceName = validation.apiKey.serviceName;
        req.apiKeyId = validation.apiKey.id;
        next();
    }
    catch (error) {
        console.error('API Key validation error:', error);
        (0, response_util_1.sendUnauthorized)(res, 'API key validation failed');
    }
}
async function requireWritePermission(req, res, next) {
    if (process.env.DISABLE_AUTH === 'true') {
        console.log('⚠️  API KEY WRITE PERMISSION DISABLED - Using mock service for testing');
        req.serviceName = process.env.TEST_SERVICE_NAME || 'finance';
        req.apiKeyId = 1;
        next();
        return;
    }
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            (0, response_util_1.sendUnauthorized)(res, 'API key is required');
            return;
        }
        const validation = await (0, apiKeys_service_1.validateApiKey)(apiKey);
        if (!validation.isValid || !validation.apiKey) {
            (0, response_util_1.sendUnauthorized)(res, 'Invalid API key');
            return;
        }
        if (!validation.apiKey.canWrite) {
            (0, response_util_1.sendUnauthorized)(res, 'API key does not have write permission');
            return;
        }
        req.serviceName = validation.apiKey.serviceName;
        req.apiKeyId = validation.apiKey.id;
        next();
    }
    catch (error) {
        console.error('Write permission check error:', error);
        (0, response_util_1.sendUnauthorized)(res, 'Permission check failed');
    }
}
