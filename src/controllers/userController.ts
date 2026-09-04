import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    // Only return users if the requester is an admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create users' });
    }

    const { name, email, password, role } = req.body;

    // "superadmin only one" -> Prevent creating another admin
    if (role === 'admin') {
      return res.status(400).json({ error: 'Cannot create another admin. Only one Super Admin is allowed.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'editor'
    });

    const userResponse = user.toObject();
    delete (userResponse as any).passwordHash;

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
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
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) return res.status(404).json({ error: 'User not found' });
    
    if (userToUpdate.role === 'admin') {
      return res.status(403).json({ error: 'Cannot modify the Super Admin via this endpoint.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, status },
      { new: true }
    ).select('-passwordHash');

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete users' });
    }

    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ error: 'User not found' });

    if (userToDelete.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete the Super Admin.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
