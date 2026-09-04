"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.setupAdmin = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const generateToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.User.findOne({ email });
        if (user && (await bcrypt_1.default.compare(password, user.passwordHash))) {
            const token = generateToken(user._id.toString(), user.role);
            // Set HTTP-only cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
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
        // Check if any admin already exists to prevent unauthorized setups
        const adminExists = await User_1.User.findOne({ role: 'admin' });
        if (adminExists) {
            return res.status(403).json({ error: 'Setup locked: An admin user already exists in the system.' });
        }
        const salt = await bcrypt_1.default.genSalt(10);
        const passwordHash = await bcrypt_1.default.hash('password123', salt);
        const user = await User_1.User.create({
            name: 'Super Admin',
            email: 'admin@technic.dev',
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
    res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0)
    });
    res.json({ message: 'Logged out successfully' });
};
exports.logout = logout;
