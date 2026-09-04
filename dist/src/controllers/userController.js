"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUsers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = require("../models/User");
const getUsers = async (req, res) => {
    try {
        // Only return users if the requester is an admin
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const users = await User_1.User.find().select('-passwordHash').sort({ createdAt: -1 });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getUsers = getUsers;
const createUser = async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can create users' });
        }
        const { name, email, password, role } = req.body;
        // "superadmin only one" -> Prevent creating another admin
        if (role === 'admin') {
            return res.status(400).json({ error: 'Cannot create another admin. Only one Super Admin is allowed.' });
        }
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const salt = await bcrypt_1.default.genSalt(10);
        const passwordHash = await bcrypt_1.default.hash(password, salt);
        const user = await User_1.User.create({
            name,
            email,
            passwordHash,
            role: role || 'editor'
        });
        const userResponse = user.toObject();
        delete userResponse.passwordHash;
        res.status(201).json(userResponse);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can update users' });
        }
        const { name, email, role, status } = req.body;
        // Prevent changing someone's role to admin
        if (role === 'admin') {
            return res.status(400).json({ error: 'Cannot promote a user to admin. Only one Super Admin is allowed.' });
        }
        // Prevent modifying the superadmin themselves via this endpoint (superadmin should update their own profile elsewhere if needed)
        const userToUpdate = await User_1.User.findById(req.params.id);
        if (!userToUpdate)
            return res.status(404).json({ error: 'User not found' });
        if (userToUpdate.role === 'admin') {
            return res.status(403).json({ error: 'Cannot modify the Super Admin via this endpoint.' });
        }
        const updatedUser = await User_1.User.findByIdAndUpdate(req.params.id, { name, email, role, status }, { new: true }).select('-passwordHash');
        res.json(updatedUser);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can delete users' });
        }
        const userToDelete = await User_1.User.findById(req.params.id);
        if (!userToDelete)
            return res.status(404).json({ error: 'User not found' });
        if (userToDelete.role === 'admin') {
            return res.status(403).json({ error: 'Cannot delete the Super Admin.' });
        }
        await User_1.User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User removed' });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.deleteUser = deleteUser;
