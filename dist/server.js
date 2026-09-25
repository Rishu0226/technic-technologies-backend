"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./src/app"));
const db_1 = require("./src/config/db");
dotenv_1.default.config();
const port = Number(process.env.PORT) || 5000;
(0, db_1.connectDatabase)()
    .then(() => {
    app_1.default.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
})
    .catch((error) => {
    const message = error instanceof Error ? error.message : "connection failed";
    console.error("MongoDB connection error:", message);
    process.exit(1);
});
