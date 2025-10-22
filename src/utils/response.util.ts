// ============================================================================
// RESPONSE UTILITY - STANDARDIZED API RESPONSES
// ============================================================================

import { Response } from 'express';
import { SuccessResponse, ErrorResponse } from '../types/auditLog';

/**
 * Send a success response
 */
export function sendSuccess<T = any>(
  res: Response,
  message: string,
  data?: T,
  meta?: any,
  statusCode: number = 200
): Response {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
  };

  return res.status(statusCode).json(response);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  message: string,
  error?: string,
  code?: string,
  statusCode: number = 400
): Response {
  const response: ErrorResponse = {
    success: false,
    message,
    ...(error && { error }),
    ...(code && { code }),
  };

  return res.status(statusCode).json(response);
}

/**
 * Send a not found response
 */
export function sendNotFound(res: Response, message: string = 'Resource not found'): Response {
  return sendError(res, message, undefined, 'NOT_FOUND', 404);
}

/**
 * Send an unauthorized response
 */
export function sendUnauthorized(
  res: Response,
  message: string = 'Unauthorized access'
): Response {
  return sendError(res, message, undefined, 'UNAUTHORIZED', 401);
}

/**
 * Send a forbidden response
 */
export function sendForbidden(
  res: Response,
  message: string = 'Access forbidden'
): Response {
  return sendError(res, message, undefined, 'FORBIDDEN', 403);
}
