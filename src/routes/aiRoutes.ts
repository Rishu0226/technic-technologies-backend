import express from 'express';
import { generateBlogContent, generateCareerContent, generateServiceContent, generateSolutionContent } from '../controllers/aiController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/ai/generate-blog', protect, generateBlogContent);
router.post('/ai/generate-career', protect, generateCareerContent);
router.post('/ai/generate-service', protect, generateServiceContent);
router.post('/ai/generate-solution', protect, generateSolutionContent);

export default router;
