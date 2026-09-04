import express from 'express';
import { login, setupAdmin, logout } from '../controllers/authController';

const router = express.Router();

router.post('/login', login);
router.post('/setup', setupAdmin); // Temporary route
router.post('/logout', logout);

export default router;
