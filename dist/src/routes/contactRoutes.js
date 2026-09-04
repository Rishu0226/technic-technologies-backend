"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const contactController_1 = require("../controllers/contactController");
const router = express_1.default.Router();
// Public routes
router.post('/contact', contactController_1.submitContact);
// Admin routes (Protected)
router.get('/admin/contacts', authMiddleware_1.protect, contactController_1.getContacts);
router.put('/admin/contacts/:id/status', authMiddleware_1.protect, contactController_1.updateContactStatus);
router.delete('/admin/contacts/:id', authMiddleware_1.protect, contactController_1.deleteContact);
exports.default = router;
