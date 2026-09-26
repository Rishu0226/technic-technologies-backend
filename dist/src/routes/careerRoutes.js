"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const upload_1 = require("../middleware/upload");
const validateObjectId_1 = require("../middleware/validateObjectId");
const careerController_1 = require("../controllers/careerController");
const router = express_1.default.Router();
(0, validateObjectId_1.validateObjectId)(router);
// Public routes — published records only, no token
router.get('/careers', careerController_1.getCareers);
router.get('/careers/:slug', careerController_1.getCareerBySlug);
router.post('/careers/:slug/applications', (req, res, next) => {
    if (!req.is('multipart/form-data')) {
        next();
        return;
    }
    upload_1.uploadResume.any()(req, res, (error) => {
        if (error) {
            const tooLarge = error instanceof Error && error.message === 'File too large';
            res.status(400).json({ error: tooLarge ? 'Upload a PDF or Word file under 5 MB.' : error.message || 'Invalid resume upload.' });
            return;
        }
        next();
    });
}, careerController_1.submitApplication);
// Admin routes (Protected)
router.get('/admin/careers', authMiddleware_1.protect, careerController_1.getAdminCareers);
router.get('/admin/careers/:id', authMiddleware_1.protect, careerController_1.getCareerById);
router.post('/admin/careers', authMiddleware_1.protect, careerController_1.createCareer);
router.put('/admin/careers/:id', authMiddleware_1.protect, careerController_1.updateCareer);
router.delete('/admin/careers/:id', authMiddleware_1.protect, careerController_1.deleteCareer);
router.get('/admin/applications/:id/resume', authMiddleware_1.protect, careerController_1.getApplicationResume);
router.get('/admin/applications', authMiddleware_1.protect, careerController_1.getApplications);
router.put('/admin/applications/:id/status', authMiddleware_1.protect, careerController_1.updateApplicationStatus);
exports.default = router;
