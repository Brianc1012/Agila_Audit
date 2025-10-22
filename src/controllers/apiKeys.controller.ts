// ============================================================================
// API KEYS CONTROLLER - API KEY MANAGEMENT REQUEST HANDLERS
// ============================================================================

import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auditLog';
import {
  sendSuccess,
  sendError,
  sendNotFound,
} from '../utils/response.util';
import {
  createApiKey,
  validateApiKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey,
  getApiKeyById,
} from '../services/apiKeys.service';

/**
 * List all API keys (SuperAdmin only)
 * GET /api/keys
 */
export async function listApiKeysHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const apiKeys = await listApiKeys();

    sendSuccess(res, 'API keys retrieved successfully', apiKeys);
  } catch (error: any) {
    console.error('List API keys error:', error);
    sendError(res, 'Failed to retrieve API keys', error.message, undefined, 500);
  }
}

/**
 * Create new API key (SuperAdmin only)
 * POST /api/keys
 */
export async function createApiKeyHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { serviceName, description, canWrite, canRead, allowedModules, expiresAt } = req.body;

    if (!serviceName) {
      sendError(res, 'serviceName is required');
      return;
    }

    const validServices = ['finance', 'hr', 'inventory', 'operations'];
    if (!validServices.includes(serviceName.toLowerCase())) {
      sendError(res, `serviceName must be one of: ${validServices.join(', ')}`);
      return;
    }

    const result = await createApiKey({
      serviceName: serviceName.toLowerCase(),
      description,
      canWrite,
      canRead,
      allowedModules,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: req.user?.username,
    });

    sendSuccess(
      res,
      'API key created successfully',
      {
        id: result.id,
        serviceName: result.serviceName,
        rawKey: result.rawKey,
        warning: 'Save this key securely. It will not be shown again.',
      },
      undefined,
      201
    );
  } catch (error: any) {
    console.error('Create API key error:', error);
    sendError(res, 'Failed to create API key', error.message, undefined, 500);
  }
}

/**
 * Validate API key (internal use)
 * POST /api/keys/validate
 */
export async function validateApiKeyHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      sendError(res, 'apiKey is required');
      return;
    }

    const validation = await validateApiKey(apiKey);

    if (!validation.isValid) {
      sendError(res, validation.error || 'Invalid API key', undefined, undefined, 401);
      return;
    }

    sendSuccess(res, 'API key is valid', validation.apiKey);
  } catch (error: any) {
    console.error('Validate API key error:', error);
    sendError(res, 'Failed to validate API key', error.message, undefined, 500);
  }
}

/**
 * Revoke API key (SuperAdmin only)
 * PATCH /api/keys/:id/revoke
 */
export async function revokeApiKeyHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      sendError(res, 'Invalid API key ID');
      return;
    }

    // Check if key exists
    const existingKey = await getApiKeyById(id);
    if (!existingKey) {
      sendNotFound(res, 'API key not found');
      return;
    }

    await revokeApiKey(id, req.user?.username);

    sendSuccess(res, 'API key revoked successfully');
  } catch (error: any) {
    console.error('Revoke API key error:', error);
    sendError(res, 'Failed to revoke API key', error.message, undefined, 500);
  }
}

/**
 * Delete API key permanently (SuperAdmin only)
 * DELETE /api/keys/:id
 */
export async function deleteApiKeyHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      sendError(res, 'Invalid API key ID');
      return;
    }

    // Check if key exists
    const existingKey = await getApiKeyById(id);
    if (!existingKey) {
      sendNotFound(res, 'API key not found');
      return;
    }

    await deleteApiKey(id);

    sendSuccess(res, 'API key deleted successfully');
  } catch (error: any) {
    console.error('Delete API key error:', error);
    sendError(res, 'Failed to delete API key', error.message, undefined, 500);
  }
}

/**
 * Get API key by ID (SuperAdmin only)
 * GET /api/keys/:id
 */
export async function getApiKeyByIdHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      sendError(res, 'Invalid API key ID');
      return;
    }

    const apiKey = await getApiKeyById(id);

    if (!apiKey) {
      sendNotFound(res, 'API key not found');
      return;
    }

    sendSuccess(res, 'API key retrieved successfully', apiKey);
  } catch (error: any) {
    console.error('Get API key by ID error:', error);
    sendError(res, 'Failed to retrieve API key', error.message, undefined, 500);
  }
}
