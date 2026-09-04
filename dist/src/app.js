"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
// Security and utility middlewares
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3005',
    'http://localhost:3000', // Added for default Next.js frontend port
    process.env.ADMIN_URL || 'http://localhost:3006'
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true, // Allow cookies
}));
// Basic health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const careerRoutes_1 = __importDefault(require("./routes/careerRoutes"));
const serviceRoutes_1 = __importDefault(require("./routes/serviceRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const blogRoutes_1 = __importDefault(require("./routes/blogRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const contactRoutes_1 = __importDefault(require("./routes/contactRoutes"));
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
exports.default = app;
