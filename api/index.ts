import dotenv from "dotenv";
import type { Request, Response } from "express";
import app from "../src/app";
import { connectDatabase } from "../src/config/db";

dotenv.config();

export default async function handler(req: Request, res: Response) {
  try {
    await connectDatabase();
  } catch (error) {
    const message = error instanceof Error ? error.message : "connection failed";
    console.error("MongoDB connection error:", message);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: "Database connection failed",
    });
    return;
  }

  return app(req, res);
}
