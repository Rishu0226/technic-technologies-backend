import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
  getCareers, 
  getCareerBySlug, 
  createCareer, 
  updateCareer, 
  deleteCareer,
  submitApplication,
  getApplications,
  updateApplicationStatus
} from '../controllers/careerController';

const router = express.Router();

// Public routes
router.get('/careers', getCareers);
router.get('/careers/:slug', getCareerBySlug);
router.post('/careers/:slug/applications', submitApplication);

// Admin routes (Protected)
router.post('/admin/careers', protect, createCareer);
router.put('/admin/careers/:id', protect, updateCareer);
router.delete('/admin/careers/:id', protect, deleteCareer);
router.get('/admin/applications', protect, getApplications);
router.put('/admin/applications/:id/status', protect, updateApplicationStatus);

export default router;
