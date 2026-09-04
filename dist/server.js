"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./src/app"));
// Load environment variables
dotenv_1.default.config();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/technictechnologies';
// Connect to MongoDB
mongoose_1.default.connect(MONGODB_URI)
    .then(() => {
    console.log('✅ Connected to MongoDB');
    // Start Express server
    app_1.default.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`Frontend URL allowed: ${process.env.FRONTEND_URL}`);
        console.log(`Admin URL allowed: ${process.env.ADMIN_URL}`);
    });
})
    .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});
