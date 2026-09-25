"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.setupAdmin = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
const generateToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id, role }, (0, jwt_1.jwtSecret)(), {
        expiresIn: '30d',
    });
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ success: false, message: 'Email and password are required', error: 'Email and password are required' });
        }
        const user = await User_1.User.findOne({ email });
        if (user && (await bcryptjs_1.default.compare(password, user.passwordHash))) {
            const token = generateToken(user._id.toString(), user.role);
            // Set HTTP-only cookie
            const production = process.env.NODE_ENV === 'production';
            res.cookie('token', token, {
                httpOnly: true,
                secure: production,
                sameSite: production ? 'none' : 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token // Also returning token for standard Bearer auth if needed
            });
        }
        else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.login = login;
// Only for initial setup - in real app, remove or protect this route
const setupAdmin = async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ success: false, message: 'Setup is disabled in production', error: 'Setup is disabled in production' });
        }
        const email = process.env.DEFAULT_ADMIN_EMAIL;
        const password = process.env.DEFAULT_ADMIN_PASSWORD;
        if (!email || !password) {
            return res.status(500).json({ success: false, message: 'Default admin is not configured', error: 'Default admin is not configured' });
        }
        // Check if any admin already exists to prevent unauthorized setups
        const adminExists = await User_1.User.findOne({ role: 'admin' });
        if (adminExists) {
            return res.status(403).json({ error: 'Setup locked: An admin user already exists in the system.' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const user = await User_1.User.create({
            name: 'Super Admin',
            email,
            passwordHash,
            role: 'admin'
        });
        res.status(201).json({ message: 'Super Admin created successfully. Please login and change the default password immediately.' });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error during setup' });
    }
};
exports.setupAdmin = setupAdmin;
const logout = async (req, res) => {
    const production = process.env.NODE_ENV === 'production';
    res.cookie('token', '', {
        httpOnly: true,
        secure: production,
        sameSite: production ? 'none' : 'strict',
        expires: new Date(0)
    });
    res.json({ message: 'Logged out successfully' });
};
exports.logout = logout;
