import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getSettings, updateSettings } from '../controllers/settingsController';

const router = express.Router();

// Public route
router.get('/settings', getSettings);

// Admin route (Protected)
router.put('/admin/settings', protect, updateSettings);

export default router;
