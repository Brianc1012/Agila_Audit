// ============================================================================
// AUDIT LOGS MICROSERVICE - MAIN APPLICATION
// ============================================================================

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware';
import { apiRateLimiter } from './middlewares/rateLimit.middleware';

// Import routes
import superAdminRoutes from './routes/super_admin.routes';
import departmentAdminRoutes from './routes/department_admin.routes';
import userRoutes from './routes/user.routes';
import summariesRoutes from './routes/summaries.routes';
import apiKeysRoutes from './routes/apiKeys.routes';

const app: Application = express();

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4003',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global rate limiting
app.use('/api', apiRateLimiter);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: process.env.SERVICE_NAME || 'audit-logs-microservice',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

// Role-based audit log routes
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/department-admin', departmentAdminRoutes);
app.use('/api/user', userRoutes);

// Other routes
app.use('/api/summaries', summariesRoutes);
app.use('/api/keys', apiKeysRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================================================
// EXPORT
// ============================================================================

export default app;
