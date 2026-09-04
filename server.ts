import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './src/app';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/technictechnologies';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`Frontend URL allowed: ${process.env.FRONTEND_URL}`);
      console.log(`Admin URL allowed: ${process.env.ADMIN_URL}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
