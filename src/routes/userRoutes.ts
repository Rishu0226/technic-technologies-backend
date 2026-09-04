import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController';

const router = express.Router();

// Apply middlewares directly to routes instead of router.use() to prevent leaking

router.route('/admin/users')
  .get(protect, authorize('admin'), getUsers)
  .post(protect, authorize('admin'), createUser);

router.route('/admin/users/:id')
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

export default router;
