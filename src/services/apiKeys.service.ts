// ============================================================================
// API KEYS SERVICE - SERVICE-TO-SERVICE AUTHENTICATION
// ============================================================================

import prisma from '../prisma/client';
import { hashValue, compareHash, generateApiKey } from '../utils/hash.util';
import { CreateApiKeyDTO, ApiKeyValidationResult } from '../types/auditLog';

/**
 * Create a new API key
 */
export async function createApiKey(data: CreateApiKeyDTO): Promise<{
  id: number;
  rawKey: string;
  serviceName: string;
}> {
  const rawKey = generateApiKey(data.serviceName);
  const keyHash = hashValue(rawKey);

  const apiKey = await prisma.apiKey.create({
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
    rawKey, // Return raw key only once
    serviceName: apiKey.serviceName,
  };
}

/**
 * Validate an API key
 */
export async function validateApiKey(rawKey: string): Promise<ApiKeyValidationResult> {
  try {
    const keyHash = hashValue(rawKey);

    const apiKey = await prisma.apiKey.findUnique({
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

    // Update last used timestamp
    await prisma.apiKey.update({
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
  } catch (error: any) {
    console.error('API key validation error:', error);
    return {
      isValid: false,
      error: 'Validation failed',
    };
  }
}

/**
 * List all API keys (admin only)
 */
export async function listApiKeys(): Promise<any[]> {
  return await prisma.apiKey.findMany({
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

/**
 * Revoke an API key
 */
export async function revokeApiKey(
  id: number,
  revokedBy?: string
): Promise<void> {
  await prisma.apiKey.update({
    where: { id },
    data: {
      isActive: false,
      revokedAt: new Date(),
      revokedBy,
    },
  });
}

/**
 * Delete an API key permanently (SuperAdmin only)
 */
export async function deleteApiKey(id: number): Promise<void> {
  await prisma.apiKey.delete({
    where: { id },
  });
}

/**
 * Get API key by ID
 */
export async function getApiKeyById(id: number): Promise<any | null> {
  return await prisma.apiKey.findUnique({
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
