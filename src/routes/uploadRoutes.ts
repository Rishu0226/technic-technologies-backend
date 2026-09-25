import express from "express";
import { protect } from "../middleware/authMiddleware";
import { uploadImage } from "../middleware/upload";
import { listMedia, uploadAsset } from "../controllers/uploadController";

const router = express.Router();

router.get("/media", protect, listMedia);

router.post("/upload", protect, (req, res, next) => {
  uploadImage.single("image")(req, res, (error) => {
    if (error) {
      res.status(400).json({ error: error.message || "Invalid image upload." });
      return;
    }
    next();
  });
}, uploadAsset);

export default router;
