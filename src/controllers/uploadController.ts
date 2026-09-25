import { Response } from "express";
import { Readable } from "stream";
import cloudinary from "../config/cloudinary";
import { Media } from "../models/Media";
import { AuthRequest } from "../middleware/authMiddleware";

const FOLDERS = new Set(["blogs", "products", "services", "media"]);

function uploadBuffer(buffer: Buffer, folder: string, filename: string) {
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `technic/${folder}`,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        filename_override: filename.replace(/\.[^.]+$/, ""),
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary did not return an upload result."));
          return;
        }
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}

export const uploadAsset = async (req: AuthRequest, res: Response) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ error: "Cloudinary is not configured." });
    }

    const file = req.file;
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authorized." });
    }
    if (!file) {
      return res.status(400).json({ success: false, message: "Choose a file to upload.", error: "Choose a file to upload." });
    }

    const requested = String(req.body.folder || "media");
    const folder = FOLDERS.has(requested) ? requested : "media";
    const uploaded = await uploadBuffer(file.buffer, folder, file.originalname);

    const media = await Media.create({
      filename: file.originalname,
      url: uploaded.secure_url,
      type: file.mimetype.startsWith("video/") ? "video" : "image",
      mimeType: file.mimetype,
      size: file.size,
      alt: String(req.body.alt || ""),
      uploadedBy: req.user.id,
    });

    res.status(201).json({
      url: media.url,
      publicId: uploaded.public_id,
      id: media._id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: "Upload failed.", error: "Upload failed." });
  }
};

export const listMedia = async (_req: AuthRequest, res: Response) => {
  try {
    const items = await Media.find().sort({ createdAt: -1 }).limit(100);
    res.json(items);
  } catch {
    res.status(500).json({ error: "Could not load media." });
  }
};
