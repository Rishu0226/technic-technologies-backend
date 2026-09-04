"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const userController_1 = require("../controllers/userController");
const router = express_1.default.Router();
// All user management routes require authentication and 'admin' role
router.use(authMiddleware_1.protect);
router.use((0, authMiddleware_1.authorize)('admin'));
router.route('/admin/users')
    .get(userController_1.getUsers)
    .post(userController_1.createUser);
router.route('/admin/users/:id')
    .put(userController_1.updateUser)
    .delete(userController_1.deleteUser);
exports.default = router;
