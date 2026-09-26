"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const mongoose_1 = __importDefault(require("mongoose"));
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const db_1 = require("./config/db");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(express_1.default.json({ limit: '1mb' }));
app.use((0, cookie_parser_1.default)());
const localOrigins = [
    'http://localhost:3000',
    'http://localhost:3005',
    'http://localhost:3006',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3005',
    'http://127.0.0.1:3006',
    'http://127.0.0.1:5000',
];
function normalizeOrigin(value) {
    return value?.trim().replace(/\/$/, '') || '';
}
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowed = new Set([
            ...localOrigins,
            normalizeOrigin(process.env.FRONTEND_URL),
            normalizeOrigin(process.env.ADMIN_URL),
        ].filter(Boolean));
        if (allowed.has(origin.replace(/\/$/, ''))) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
}));
app.use(requestLogger_1.requestLogger);
const health = (_req, res) => {
    const connected = mongoose_1.default.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({
        success: connected,
        status: connected ? 'healthy' : 'unhealthy',
        environment: process.env.NODE_ENV || 'development',
    });
};
app.use(async (req, res, next) => {
    try {
        await (0, db_1.connectDatabase)();
        next();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'connection failed';
        res.locals.errorMessage = `MongoDB connection error: ${message.replace(/\/\/[^@\s/]+@/g, '//***@')}`;
        if (req.path === '/api/health' || req.path === '/health') {
            health(req, res);
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: 'Database connection failed',
        });
    }
});
app.get('/api/health', health);
app.get('/health', health);
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const careerRoutes_1 = __importDefault(require("./routes/careerRoutes"));
const serviceRoutes_1 = __importDefault(require("./routes/serviceRoutes"));
const solutionRoutes_1 = __importDefault(require("./routes/solutionRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const blogRoutes_1 = __importDefault(require("./routes/blogRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const contactRoutes_1 = __importDefault(require("./routes/contactRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
// Mount routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api', userRoutes_1.default);
app.use('/api', careerRoutes_1.default);
app.use('/api', serviceRoutes_1.default);
app.use('/api', solutionRoutes_1.default);
app.use('/api', productRoutes_1.default);
app.use('/api', blogRoutes_1.default);
app.use('/api', settingsRoutes_1.default);
app.use('/api', contactRoutes_1.default);
app.use('/api/admin', aiRoutes_1.default);
app.use('/api/admin', uploadRoutes_1.default);
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
exports.default = app;
