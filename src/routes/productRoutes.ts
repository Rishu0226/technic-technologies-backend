import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { validateObjectId } from '../middleware/validateObjectId';
import { 
  getProducts, 
  getAdminProducts,
  getProductBySlug, 
  getProductById,
  createProduct, 
  updateProduct, 
  deleteProduct
} from '../controllers/productController';

const router = express.Router();
validateObjectId(router);

// Public routes — published records only, no token
router.get('/products', getProducts);
router.get('/products/:slug', getProductBySlug);

// Admin routes (Protected)
router.get('/admin/products', protect, getAdminProducts);
router.get('/admin/products/:id', protect, getProductById);
router.post('/admin/products', protect, createProduct);
router.put('/admin/products/:id', protect, updateProduct);
router.delete('/admin/products/:id', protect, deleteProduct);

export default router;
