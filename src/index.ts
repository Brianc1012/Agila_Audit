// ============================================================================
// AUDIT LOGS MICROSERVICE - SERVER ENTRY POINT
// ============================================================================

import dotenv from 'dotenv';
import app from './app';
import prisma from './prisma/client';
import cache from './utils/cache.util';

// Load environment variables
dotenv.config();

// Backend should use BACKEND_PORT (4004), not PORT (which is for Next.js frontend)
const PORT = process.env.BACKEND_PORT || 4004;
const HOST = process.env.HOST || 'localhost';

// ============================================================================
// START SERVER
// ============================================================================

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start listening
    app.listen(Number(PORT), HOST, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 Audit Logs Microservice`);
      console.log(`📡 Server running at: http://${HOST}:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Service: ${process.env.SERVICE_NAME || 'audit-logs-microservice'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received, shutting down gracefully...`);
  
  try {
    // Disconnect Redis
    await cache.disconnect();
    
    // Disconnect database
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// ============================================================================
// START
// ============================================================================

startServer();
