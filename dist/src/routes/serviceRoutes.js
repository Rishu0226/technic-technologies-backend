"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const validateObjectId_1 = require("../middleware/validateObjectId");
const serviceController_1 = require("../controllers/serviceController");
const router = express_1.default.Router();
(0, validateObjectId_1.validateObjectId)(router);
// Public routes — published records only, no token
router.get('/services', serviceController_1.getServices);
router.get('/services/:slug', serviceController_1.getServiceBySlug);
// Admin routes (Protected)
router.get('/admin/services', authMiddleware_1.protect, serviceController_1.getAdminServices);
router.get('/admin/services/:id', authMiddleware_1.protect, serviceController_1.getServiceById);
router.post('/admin/services', authMiddleware_1.protect, serviceController_1.createService);
router.put('/admin/services/:id', authMiddleware_1.protect, serviceController_1.updateService);
router.delete('/admin/services/:id', authMiddleware_1.protect, serviceController_1.deleteService);
exports.default = router;
