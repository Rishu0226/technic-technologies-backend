import multer from "multer";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const RESUME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) => {
    if (RESUME_TYPES.has(file.mimetype) || /\.(pdf|doc|docx)$/i.test(file.originalname)) {
      cb(null, true);
      return;
    }
    cb(new Error("Upload a PDF or Word file under 5 MB."));
  },
});

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Upload a JPEG, PNG, WEBP, GIF, MP4, WEBM, or MOV file under 4 MB."));
  },
});
