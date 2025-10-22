// ============================================================================
// ERROR HANDLER MIDDLEWARE - CENTRALIZED ERROR HANDLING
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
  });

  if (error instanceof AppError) {
    sendError(
      res,
      error.message,
      process.env.NODE_ENV === 'development' ? error.stack : undefined,
      error.code,
      error.statusCode
    );
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    sendError(res, 'Database operation failed', error.message, 'DATABASE_ERROR', 400);
    return;
  }

  if (error.name === 'PrismaClientValidationError') {
    sendError(res, 'Invalid data provided', error.message, 'VALIDATION_ERROR', 400);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', error.message, 'INVALID_TOKEN', 401);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', error.message, 'TOKEN_EXPIRED', 401);
    return;
  }

  // Default error response
  sendError(
    res,
    'Internal server error',
    process.env.NODE_ENV === 'development' ? error.message : undefined,
    'INTERNAL_ERROR',
    500
  );
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(
    res,
    `Route ${req.method} ${req.path} not found`,
    undefined,
    'NOT_FOUND',
    404
  );
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
