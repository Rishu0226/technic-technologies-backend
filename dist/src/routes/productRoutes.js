"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const productController_1 = require("../controllers/productController");
const router = express_1.default.Router();
// Public routes
router.get('/products', productController_1.getProducts);
router.get('/products/:slug', productController_1.getProductBySlug);
// Admin routes (Protected)
router.post('/admin/products', authMiddleware_1.protect, productController_1.createProduct);
router.put('/admin/products/:id', authMiddleware_1.protect, productController_1.updateProduct);
router.delete('/admin/products/:id', authMiddleware_1.protect, productController_1.deleteProduct);
exports.default = router;
