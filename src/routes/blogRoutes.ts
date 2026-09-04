import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
  getBlogs, 
  getBlogBySlug, 
  createBlog, 
  updateBlog, 
  deleteBlog
} from '../controllers/blogController';

const router = express.Router();

// Public routes
router.get('/blogs', getBlogs);
router.get('/blogs/:slug', getBlogBySlug);

// Admin routes (Protected)
router.post('/admin/blogs', protect, createBlog);
router.put('/admin/blogs/:id', protect, updateBlog);
router.delete('/admin/blogs/:id', protect, deleteBlog);

export default router;
