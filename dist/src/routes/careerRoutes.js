"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const careerController_1 = require("../controllers/careerController");
const router = express_1.default.Router();
// Public routes
router.get('/careers', careerController_1.getCareers);
router.get('/careers/:slug', careerController_1.getCareerBySlug);
router.post('/careers/:slug/applications', careerController_1.submitApplication);
// Admin routes (Protected)
router.post('/admin/careers', authMiddleware_1.protect, careerController_1.createCareer);
router.put('/admin/careers/:id', authMiddleware_1.protect, careerController_1.updateCareer);
router.delete('/admin/careers/:id', authMiddleware_1.protect, careerController_1.deleteCareer);
router.get('/admin/applications', authMiddleware_1.protect, careerController_1.getApplications);
router.put('/admin/applications/:id/status', authMiddleware_1.protect, careerController_1.updateApplicationStatus);
exports.default = router;
