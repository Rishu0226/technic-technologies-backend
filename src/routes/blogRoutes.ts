import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { validateObjectId } from '../middleware/validateObjectId';
import { 
  getBlogs, 
  getAdminBlogs,
  getBlogBySlug, 
  getBlogById,
  createBlog, 
  updateBlog, 
  deleteBlog
} from '../controllers/blogController';

const router = express.Router();
validateObjectId(router);

// Public routes — published records only, no token
router.get('/blogs', getBlogs);
router.get('/blogs/:slug', getBlogBySlug);

// Admin routes (Protected)
router.get('/admin/blogs', protect, getAdminBlogs);
router.get('/admin/blogs/:id', protect, getBlogById);
router.post('/admin/blogs', protect, createBlog);
router.put('/admin/blogs/:id', protect, updateBlog);
router.delete('/admin/blogs/:id', protect, deleteBlog);

export default router;
