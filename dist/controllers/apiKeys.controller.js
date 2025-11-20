"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listApiKeysHandler = listApiKeysHandler;
exports.createApiKeyHandler = createApiKeyHandler;
exports.validateApiKeyHandler = validateApiKeyHandler;
exports.revokeApiKeyHandler = revokeApiKeyHandler;
exports.deleteApiKeyHandler = deleteApiKeyHandler;
exports.getApiKeyByIdHandler = getApiKeyByIdHandler;
const response_util_1 = require("../utils/response.util");
const apiKeys_service_1 = require("../services/apiKeys.service");
async function listApiKeysHandler(req, res) {
    try {
        const apiKeys = await (0, apiKeys_service_1.listApiKeys)();
        (0, response_util_1.sendSuccess)(res, 'API keys retrieved successfully', apiKeys);
    }
    catch (error) {
        console.error('List API keys error:', error);
        (0, response_util_1.sendError)(res, 'Failed to retrieve API keys', error.message, undefined, 500);
    }
}
async function createApiKeyHandler(req, res) {
    try {
        const { serviceName, description, canWrite, canRead, allowedModules, expiresAt } = req.body;
        if (!serviceName) {
            (0, response_util_1.sendError)(res, 'serviceName is required');
            return;
        }
        const validServices = ['finance', 'hr', 'inventory', 'operations'];
        if (!validServices.includes(serviceName.toLowerCase())) {
            (0, response_util_1.sendError)(res, `serviceName must be one of: ${validServices.join(', ')}`);
            return;
        }
        const result = await (0, apiKeys_service_1.createApiKey)({
            serviceName: serviceName.toLowerCase(),
            description,
            canWrite,
            canRead,
            allowedModules,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            createdBy: req.user?.username,
        });
        (0, response_util_1.sendSuccess)(res, 'API key created successfully', {
            id: result.id,
            serviceName: result.serviceName,
            rawKey: result.rawKey,
            warning: 'Save this key securely. It will not be shown again.',
        }, undefined, 201);
    }
    catch (error) {
        console.error('Create API key error:', error);
        (0, response_util_1.sendError)(res, 'Failed to create API key', error.message, undefined, 500);
    }
}
async function validateApiKeyHandler(req, res) {
    try {
        const { apiKey } = req.body;
        if (!apiKey) {
            (0, response_util_1.sendError)(res, 'apiKey is required');
            return;
        }
        const validation = await (0, apiKeys_service_1.validateApiKey)(apiKey);
        if (!validation.isValid) {
            (0, response_util_1.sendError)(res, validation.error || 'Invalid API key', undefined, undefined, 401);
            return;
        }
        (0, response_util_1.sendSuccess)(res, 'API key is valid', validation.apiKey);
    }
    catch (error) {
        console.error('Validate API key error:', error);
        (0, response_util_1.sendError)(res, 'Failed to validate API key', error.message, undefined, 500);
    }
}
async function revokeApiKeyHandler(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            (0, response_util_1.sendError)(res, 'Invalid API key ID');
            return;
        }
        const existingKey = await (0, apiKeys_service_1.getApiKeyById)(id);
        if (!existingKey) {
            (0, response_util_1.sendNotFound)(res, 'API key not found');
            return;
        }
        await (0, apiKeys_service_1.revokeApiKey)(id, req.user?.username);
        (0, response_util_1.sendSuccess)(res, 'API key revoked successfully');
    }
    catch (error) {
        console.error('Revoke API key error:', error);
        (0, response_util_1.sendError)(res, 'Failed to revoke API key', error.message, undefined, 500);
    }
}
async function deleteApiKeyHandler(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            (0, response_util_1.sendError)(res, 'Invalid API key ID');
            return;
        }
        const existingKey = await (0, apiKeys_service_1.getApiKeyById)(id);
        if (!existingKey) {
            (0, response_util_1.sendNotFound)(res, 'API key not found');
            return;
        }
        await (0, apiKeys_service_1.deleteApiKey)(id);
        (0, response_util_1.sendSuccess)(res, 'API key deleted successfully');
    }
    catch (error) {
        console.error('Delete API key error:', error);
        (0, response_util_1.sendError)(res, 'Failed to delete API key', error.message, undefined, 500);
    }
}
async function getApiKeyByIdHandler(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            (0, response_util_1.sendError)(res, 'Invalid API key ID');
            return;
        }
        const apiKey = await (0, apiKeys_service_1.getApiKeyById)(id);
        if (!apiKey) {
            (0, response_util_1.sendNotFound)(res, 'API key not found');
            return;
        }
        (0, response_util_1.sendSuccess)(res, 'API key retrieved successfully', apiKey);
    }
    catch (error) {
        console.error('Get API key by ID error:', error);
        (0, response_util_1.sendError)(res, 'Failed to retrieve API key', error.message, undefined, 500);
    }
}
