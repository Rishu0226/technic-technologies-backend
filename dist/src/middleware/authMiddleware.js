"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../utils/jwt");
const protect = async (req, res, next) => {
    let token;
    // Try extracting from cookies first, then authorization header
    if (req.cookies?.token) {
        token = req.cookies.token;
    }
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, (0, jwt_1.jwtSecret)());
            req.user = decoded;
            next();
        }
        catch (error) {
            const missingSecret = error instanceof Error && error.message === 'JWT_SECRET is not set';
            res.status(missingSecret ? 500 : 401).json({
                success: false,
                message: missingSecret ? 'Server authentication is not configured' : 'Not authorized, token failed',
                error: missingSecret ? 'Server authentication is not configured' : 'Not authorized, token failed',
            });
        }
    }
    else {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};
exports.protect = protect;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Role ${req.user?.role || 'unknown'} is not authorized to access this route` });
        }
        next();
    };
};
exports.authorize = authorize;
