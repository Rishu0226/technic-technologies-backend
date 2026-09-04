import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3005',
  'http://localhost:3000', // Added for default Next.js frontend port
  process.env.ADMIN_URL || 'http://localhost:3006'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
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
import authRoutes from './routes/authRoutes';
import careerRoutes from './routes/careerRoutes';
import serviceRoutes from './routes/serviceRoutes';
import productRoutes from './routes/productRoutes';
import blogRoutes from './routes/blogRoutes';
import settingsRoutes from './routes/settingsRoutes';
import contactRoutes from './routes/contactRoutes';

import userRoutes from './routes/userRoutes';

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', careerRoutes);
app.use('/api', serviceRoutes);
app.use('/api', productRoutes);
app.use('/api', blogRoutes);
app.use('/api', settingsRoutes);
app.use('/api', contactRoutes);

export default app;
