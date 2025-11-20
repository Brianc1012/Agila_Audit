"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const rateLimit_middleware_1 = require("./middlewares/rateLimit.middleware");
const super_admin_routes_1 = __importDefault(require("./routes/super_admin.routes"));
const department_admin_routes_1 = __importDefault(require("./routes/department_admin.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const summaries_routes_1 = __importDefault(require("./routes/summaries.routes"));
const apiKeys_routes_1 = __importDefault(require("./routes/apiKeys.routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4003',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
app.use('/api', rateLimit_middleware_1.apiRateLimiter);
app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: process.env.SERVICE_NAME || 'audit-logs-microservice',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
    });
});
app.use('/api/super-admin', super_admin_routes_1.default);
app.use('/api/department-admin', department_admin_routes_1.default);
app.use('/api/user', user_routes_1.default);
app.use('/api/summaries', summaries_routes_1.default);
app.use('/api/keys', apiKeys_routes_1.default);
app.use(errorHandler_middleware_1.notFoundHandler);
app.use(errorHandler_middleware_1.errorHandler);
exports.default = app;
