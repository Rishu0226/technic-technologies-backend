import express from "express";
import dotenv from "dotenv";
import app from "./src/app";
import { connectDatabase } from "./src/config/db";

dotenv.config();

const port = Number(process.env.PORT) || 5000;

if (!process.env.VERCEL) {
  connectDatabase()
    .then(() => {
      app.listen(port, () => {
        console.log(`[SUCCESS] Server is running on port ${port}`);
      });
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : "connection failed";
      console.error(`[ERROR] MongoDB connection error: ${message.replace(/\/\/[^@\s/]+@/g, "//***@")}`);
      process.exit(1);
    });
}

export default app;
