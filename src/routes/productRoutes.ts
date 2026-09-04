import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
  getProducts, 
  getProductBySlug, 
  createProduct, 
  updateProduct, 
  deleteProduct
} from '../controllers/productController';

const router = express.Router();

// Public routes
router.get('/products', getProducts);
router.get('/products/:slug', getProductBySlug);

// Admin routes (Protected)
router.post('/admin/products', protect, createProduct);
router.put('/admin/products/:id', protect, updateProduct);
router.delete('/admin/products/:id', protect, deleteProduct);

export default router;
