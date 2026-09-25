import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { errorHandler, notFound } from './middleware/errorHandler';
import { connectDatabase } from './config/db';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

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

function normalizeOrigin(value?: string) {
  return value?.trim().replace(/\/$/, '') || '';
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowed = new Set(
      [
        ...localOrigins,
        normalizeOrigin(process.env.FRONTEND_URL),
        normalizeOrigin(process.env.ADMIN_URL),
      ].filter(Boolean),
    );

    if (allowed.has(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
}));

const health = (_req: express.Request, res: express.Response) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    success: connected,
    status: connected ? 'healthy' : 'unhealthy',
    environment: process.env.NODE_ENV || 'development',
  });
};

app.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'connection failed';
    console.error('MongoDB connection error:', message.replace(/\/\/[^@\s/]+@/g, '//***@'));
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
import authRoutes from './routes/authRoutes';
import careerRoutes from './routes/careerRoutes';
import serviceRoutes from './routes/serviceRoutes';
import solutionRoutes from './routes/solutionRoutes';
import productRoutes from './routes/productRoutes';
import blogRoutes from './routes/blogRoutes';
import settingsRoutes from './routes/settingsRoutes';
import contactRoutes from './routes/contactRoutes';
import aiRoutes from './routes/aiRoutes';
import uploadRoutes from './routes/uploadRoutes';

import userRoutes from './routes/userRoutes';

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', careerRoutes);
app.use('/api', serviceRoutes);
app.use('/api', solutionRoutes);
app.use('/api', productRoutes);
app.use('/api', blogRoutes);
app.use('/api', settingsRoutes);
app.use('/api', contactRoutes);
app.use('/api/admin', aiRoutes);
app.use('/api/admin', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
