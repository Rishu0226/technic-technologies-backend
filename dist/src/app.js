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
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
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
const health = (_req, res) => {
    const connected = mongoose_1.default.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({
        success: connected,
        status: connected ? 'healthy' : 'unhealthy',
        environment: process.env.NODE_ENV || 'development',
    });
};
app.get('/api/health', health);
app.get('/health', health);
app.param('id', (req, res, next, id) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400).json({
            success: false,
            message: 'Invalid id',
            error: 'Invalid id',
        });
        return;
    }
    next();
});
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const careerRoutes_1 = __importDefault(require("./routes/careerRoutes"));
const serviceRoutes_1 = __importDefault(require("./routes/serviceRoutes"));
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
app.use('/api', productRoutes_1.default);
app.use('/api', blogRoutes_1.default);
app.use('/api', settingsRoutes_1.default);
app.use('/api', contactRoutes_1.default);
app.use('/api/admin', aiRoutes_1.default);
app.use('/api/admin', uploadRoutes_1.default);
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
exports.default = app;
