"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const validateObjectId_1 = require("../middleware/validateObjectId");
const userController_1 = require("../controllers/userController");
const router = express_1.default.Router();
(0, validateObjectId_1.validateObjectId)(router);
// Apply middlewares directly to routes instead of router.use() to prevent leaking
router.route('/admin/users')
    .get(authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), userController_1.getUsers)
    .post(authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), userController_1.createUser);
router.route('/admin/users/:id')
    .put(authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), userController_1.updateUser)
    .delete(authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), userController_1.deleteUser);
exports.default = router;
