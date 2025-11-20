"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiKey = createApiKey;
exports.validateApiKey = validateApiKey;
exports.listApiKeys = listApiKeys;
exports.revokeApiKey = revokeApiKey;
exports.deleteApiKey = deleteApiKey;
exports.getApiKeyById = getApiKeyById;
const client_1 = __importDefault(require("../prisma/client"));
const hash_util_1 = require("../utils/hash.util");
async function createApiKey(data) {
    const rawKey = (0, hash_util_1.generateApiKey)(data.serviceName);
    const keyHash = (0, hash_util_1.hashValue)(rawKey);
    const apiKey = await client_1.default.apiKey.create({
        data: {
            keyHash,
            serviceName: data.serviceName,
            description: data.description,
            canWrite: data.canWrite ?? true,
            canRead: data.canRead ?? false,
            allowedModules: data.allowedModules ? JSON.stringify(data.allowedModules) : null,
            expiresAt: data.expiresAt,
            createdBy: data.createdBy,
        },
    });
    return {
        id: apiKey.id,
        rawKey,
        serviceName: apiKey.serviceName,
    };
}
async function validateApiKey(rawKey) {
    try {
        const keyHash = (0, hash_util_1.hashValue)(rawKey);
        const apiKey = await client_1.default.apiKey.findUnique({
            where: { keyHash },
            select: {
                id: true,
                serviceName: true,
                canWrite: true,
                canRead: true,
                allowedModules: true,
                isActive: true,
                expiresAt: true,
            },
        });
        if (!apiKey) {
            return {
                isValid: false,
                error: 'API key not found',
            };
        }
        if (!apiKey.isActive) {
            return {
                isValid: false,
                error: 'API key has been revoked',
            };
        }
        if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
            return {
                isValid: false,
                error: 'API key has expired',
            };
        }
        await client_1.default.apiKey.update({
            where: { id: apiKey.id },
            data: { lastUsedAt: new Date() },
        });
        return {
            isValid: true,
            apiKey: {
                id: apiKey.id,
                serviceName: apiKey.serviceName,
                canWrite: apiKey.canWrite,
                canRead: apiKey.canRead,
                allowedModules: apiKey.allowedModules || undefined,
            },
        };
    }
    catch (error) {
        console.error('API key validation error:', error);
        return {
            isValid: false,
            error: 'Validation failed',
        };
    }
}
async function listApiKeys() {
    return await client_1.default.apiKey.findMany({
        select: {
            id: true,
            serviceName: true,
            description: true,
            canWrite: true,
            canRead: true,
            allowedModules: true,
            isActive: true,
            expiresAt: true,
            createdAt: true,
            createdBy: true,
            lastUsedAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });
}
async function revokeApiKey(id, revokedBy) {
    await client_1.default.apiKey.update({
        where: { id },
        data: {
            isActive: false,
            revokedAt: new Date(),
            revokedBy,
        },
    });
}
async function deleteApiKey(id) {
    await client_1.default.apiKey.delete({
        where: { id },
    });
}
async function getApiKeyById(id) {
    return await client_1.default.apiKey.findUnique({
        where: { id },
        select: {
            id: true,
            serviceName: true,
            description: true,
            canWrite: true,
            canRead: true,
            allowedModules: true,
            isActive: true,
            expiresAt: true,
            createdAt: true,
            createdBy: true,
            lastUsedAt: true,
            revokedAt: true,
            revokedBy: true,
        },
    });
}
