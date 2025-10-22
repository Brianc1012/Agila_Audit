// ============================================================================
// API KEYS ROUTES
// ============================================================================

import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireSuperAdmin } from '../middlewares/roleAccess.middleware';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { readRateLimiter, writeRateLimiter } from '../middlewares/rateLimit.middleware';
import {
  listApiKeysHandler,
  createApiKeyHandler,
  validateApiKeyHandler,
  revokeApiKeyHandler,
  deleteApiKeyHandler,
  getApiKeyByIdHandler,
} from '../controllers/apiKeys.controller';

const router = Router();

/**
 * List all API keys (SuperAdmin only)
 * GET /api/keys
 */
router.get(
  '/',
  readRateLimiter,
  authenticateJWT,
  requireSuperAdmin,
  asyncHandler(listApiKeysHandler)
);

/**
 * Get API key by ID (SuperAdmin only)
 * GET /api/keys/:id
 */
router.get(
  '/:id',
  readRateLimiter,
  authenticateJWT,
  requireSuperAdmin,
  asyncHandler(getApiKeyByIdHandler)
);

/**
 * Create new API key (SuperAdmin only)
 * POST /api/keys
 */
router.post(
  '/',
  writeRateLimiter,
  authenticateJWT,
  requireSuperAdmin,
  asyncHandler(createApiKeyHandler)
);

/**
 * Validate API key (internal use)
 * POST /api/keys/validate
 */
router.post(
  '/validate',
  readRateLimiter,
  asyncHandler(validateApiKeyHandler)
);

/**
 * Revoke API key (SuperAdmin only)
 * PATCH /api/keys/:id/revoke
 */
router.patch(
  '/:id/revoke',
  writeRateLimiter,
  authenticateJWT,
  requireSuperAdmin,
  asyncHandler(revokeApiKeyHandler)
);

/**
 * Delete API key permanently (SuperAdmin only)
 * DELETE /api/keys/:id
 */
router.delete(
  '/:id',
  writeRateLimiter,
  authenticateJWT,
  requireSuperAdmin,
  asyncHandler(deleteApiKeyHandler)
);

export default router;
