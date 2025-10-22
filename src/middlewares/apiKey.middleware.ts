// ============================================================================
// API KEY MIDDLEWARE - SERVICE AUTHENTICATION
// ============================================================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auditLog';
import { sendUnauthorized } from '../utils/response.util';
import { validateApiKey } from '../services/apiKeys.service';

/**
 * Middleware to validate API key and inject service context
 */
export async function validateApiKeyMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // 🔓 QUICK BYPASS FOR TESTING - Set DISABLE_AUTH=true in .env
  if (process.env.DISABLE_AUTH === 'true') {
    console.log('⚠️  API KEY AUTH DISABLED - Using mock service for testing');
    req.serviceName = process.env.TEST_SERVICE_NAME || 'finance';  // Change to test different services
    req.apiKeyId = 1;
    next();
    return;
  }

  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      sendUnauthorized(res, 'API key is required');
      return;
    }

    const validation = await validateApiKey(apiKey);

    if (!validation.isValid || !validation.apiKey) {
      sendUnauthorized(res, validation.error || 'Invalid API key');
      return;
    }

    // Inject service context into request
    req.serviceName = validation.apiKey.serviceName;
    req.apiKeyId = validation.apiKey.id;

    next();
  } catch (error: any) {
    console.error('API Key validation error:', error);
    sendUnauthorized(res, 'API key validation failed');
  }
}

/**
 * Middleware to check if API key has write permission
 */
export async function requireWritePermission(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // 🔓 QUICK BYPASS FOR TESTING
  if (process.env.DISABLE_AUTH === 'true') {
    console.log('⚠️  API KEY WRITE PERMISSION DISABLED - Using mock service for testing');
    req.serviceName = process.env.TEST_SERVICE_NAME || 'finance';
    req.apiKeyId = 1;
    next();
    return;
  }

  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      sendUnauthorized(res, 'API key is required');
      return;
    }

    const validation = await validateApiKey(apiKey);

    if (!validation.isValid || !validation.apiKey) {
      sendUnauthorized(res, 'Invalid API key');
      return;
    }

    if (!validation.apiKey.canWrite) {
      sendUnauthorized(res, 'API key does not have write permission');
      return;
    }

    // Inject service context
    req.serviceName = validation.apiKey.serviceName;
    req.apiKeyId = validation.apiKey.id;

    next();
  } catch (error: any) {
    console.error('Write permission check error:', error);
    sendUnauthorized(res, 'Permission check failed');
  }
}
