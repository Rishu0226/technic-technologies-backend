"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const blogController_1 = require("../controllers/blogController");
const router = express_1.default.Router();
// Public routes
router.get('/blogs', blogController_1.getBlogs);
router.get('/blogs/:slug', blogController_1.getBlogBySlug);
// Admin routes (Protected)
router.post('/admin/blogs', authMiddleware_1.protect, blogController_1.createBlog);
router.put('/admin/blogs/:id', authMiddleware_1.protect, blogController_1.updateBlog);
router.delete('/admin/blogs/:id', authMiddleware_1.protect, blogController_1.deleteBlog);
exports.default = router;
