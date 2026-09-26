import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { uploadResume } from '../middleware/upload';
import { validateObjectId } from '../middleware/validateObjectId';
import { 
  getCareers, 
  getAdminCareers,
  getCareerBySlug, 
  getCareerById,
  createCareer, 
  updateCareer, 
  deleteCareer,
  submitApplication,
  getApplicationResume,
  getApplications,
  updateApplicationStatus
} from '../controllers/careerController';

const router = express.Router();
validateObjectId(router);

// Public routes — published records only, no token
router.get('/careers', getCareers);
router.get('/careers/:slug', getCareerBySlug);
router.post('/careers/:slug/applications', (req, res, next) => {
  if (!req.is('multipart/form-data')) {
    next();
    return;
  }
  uploadResume.any()(req, res, (error) => {
    if (error) {
      const tooLarge = error instanceof Error && error.message === 'File too large';
      res.status(400).json({ error: tooLarge ? 'Upload a PDF or Word file under 5 MB.' : error.message || 'Invalid resume upload.' });
      return;
    }
    next();
  });
}, submitApplication);

// Admin routes (Protected)
router.get('/admin/careers', protect, getAdminCareers);
router.get('/admin/careers/:id', protect, getCareerById);
router.post('/admin/careers', protect, createCareer);
router.put('/admin/careers/:id', protect, updateCareer);
router.delete('/admin/careers/:id', protect, deleteCareer);
router.get('/admin/applications/:id/resume', protect, getApplicationResume);
router.get('/admin/applications', protect, getApplications);
router.put('/admin/applications/:id/status', protect, updateApplicationStatus);

export default router;
