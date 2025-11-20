"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const client_1 = __importDefault(require("./prisma/client"));
const cache_util_1 = __importDefault(require("./utils/cache.util"));
dotenv_1.default.config();
const PORT = process.env.BACKEND_PORT || 4004;
const HOST = process.env.HOST || 'localhost';
async function startServer() {
    try {
        await client_1.default.$connect();
        console.log('✅ Database connected successfully');
        app_1.default.listen(Number(PORT), HOST, () => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`🚀 Audit Logs Microservice`);
            console.log(`📡 Server running at: http://${HOST}:${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📊 Service: ${process.env.SERVICE_NAME || 'audit-logs-microservice'}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
async function gracefulShutdown(signal) {
    console.log(`\n${signal} received, shutting down gracefully...`);
    try {
        await cache_util_1.default.disconnect();
        await client_1.default.$disconnect();
        console.log('✅ Database disconnected');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});
startServer();
