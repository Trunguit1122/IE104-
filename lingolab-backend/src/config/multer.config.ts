import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Storage configuration for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${uuidv4()}${ext}`);
  },
});

// Storage configuration for recording uploads
const recordingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/recordings");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `recording_${uuidv4()}${ext}`);
  },
});

// File filter for images
const imageFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpg, .jpeg, and .png files are allowed"));
  }
};

// File filter for audio
const audioFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ["audio/wav", "audio/mp3", "audio/mpeg", "audio/webm"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only .wav and .mp3 files are allowed"));
  }
};

// Avatar upload middleware (max 2MB)
export const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

// Recording upload middleware (max 10MB)
export const recordingUpload = multer({
  storage: recordingStorage,
  fileFilter: audioFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Memory storage for processing (cloud upload)
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

