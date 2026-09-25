import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { jwtSecret } from '../utils/jwt';

const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, jwtSecret(), {
    expiresIn: '30d',
  });
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Email and password are required', error: 'Email and password are required' });
    }
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
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
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Only for initial setup - in real app, remove or protect this route
export const setupAdmin = async (req: Request, res: Response) => {
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
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(403).json({ error: 'Setup locked: An admin user already exists in the system.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: 'Super Admin',
      email,
      passwordHash,
      role: 'admin'
    });

    res.status(201).json({ message: 'Super Admin created successfully. Please login and change the default password immediately.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error during setup' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const production = process.env.NODE_ENV === 'production';
  res.cookie('token', '', {
    httpOnly: true,
    secure: production,
    sameSite: production ? 'none' : 'strict',
    expires: new Date(0)
  });
  res.json({ message: 'Logged out successfully' });
};
