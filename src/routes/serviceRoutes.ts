import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { validateObjectId } from '../middleware/validateObjectId';
import { 
  getServices, 
  getServiceBySlug,
  getServiceById,
  createService, 
  updateService, 
  deleteService
} from '../controllers/serviceController';

const router = express.Router();
validateObjectId(router);

// Public routes
router.get('/services', getServices);
router.get('/services/:slug', getServiceBySlug);

// Admin routes (Protected)
router.get('/admin/services/:id', protect, getServiceById);
router.post('/admin/services', protect, createService);
router.put('/admin/services/:id', protect, updateService);
router.delete('/admin/services/:id', protect, deleteService);

export default router;
