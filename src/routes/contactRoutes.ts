import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
  submitContact, 
  getContacts, 
  updateContactStatus, 
  deleteContact 
} from '../controllers/contactController';

const router = express.Router();

// Public routes
router.post('/contact', submitContact);

// Admin routes (Protected)
router.get('/admin/contacts', protect, getContacts);
router.put('/admin/contacts/:id/status', protect, updateContactStatus);
router.delete('/admin/contacts/:id', protect, deleteContact);

export default router;
