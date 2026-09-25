import express from 'express';
import { generateBlogContent, generateCareerContent } from '../controllers/aiController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/ai/generate-blog', protect, generateBlogContent);
router.post('/ai/generate-career', protect, generateCareerContent);

export default router;
