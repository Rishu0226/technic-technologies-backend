import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { validateObjectId } from '../middleware/validateObjectId';
import {
  getSolutions,
  getSolutionBySlug,
  getSolutionById,
  createSolution,
  updateSolution,
  deleteSolution,
} from '../controllers/solutionController';

const router = express.Router();
validateObjectId(router);

router.get('/solutions', getSolutions);
router.get('/solutions/:slug', getSolutionBySlug);

router.get('/admin/solutions/:id', protect, getSolutionById);
router.post('/admin/solutions', protect, createSolution);
router.put('/admin/solutions/:id', protect, updateSolution);
router.delete('/admin/solutions/:id', protect, deleteSolution);

export default router;
