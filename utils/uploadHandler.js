const fs = require("fs");
const path = require("path");
const multer = require("multer");

const DEFAULT_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function ensureDirectory(destination) {
  fs.mkdirSync(destination, { recursive: true });
  return destination;
}

function buildSafeFileName(originalName = "file") {
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path
    .basename(originalName, extension)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const fallbackName = baseName || "file";

  return `${Date.now()}-${Math.round(Math.random() * 1e9)}-${fallbackName}${extension}`;
}

function createDiskUpload(options = {}) {
  const {
    destination,
    allowedMimeTypes = [],
    fileSize = DEFAULT_FILE_SIZE
  } = options;

  if (!destination) {
    throw new Error("destination is required when using createDiskUpload");
  }

  return multer({
    storage: multer.diskStorage({
      destination(req, file, callback) {
        try {
          callback(null, ensureDirectory(destination));
        } catch (error) {
          callback(error);
        }
      },
      filename(req, file, callback) {
        callback(null, buildSafeFileName(file.originalname));
      }
    }),
    limits: {
      fileSize
    },
    fileFilter(req, file, callback) {
      if (!allowedMimeTypes.length || allowedMimeTypes.includes(file.mimetype)) {
        return callback(null, true);
      }

      const error = new Error("Only image files are allowed");
      error.status = 400;

      return callback(error);
    }
  });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: DEFAULT_FILE_SIZE
  }
});

module.exports = {
  IMAGE_MIME_TYPES,
  createDiskUpload,
  uploadSingle: upload.single.bind(upload),
  uploadMany: upload.array.bind(upload),
  uploadFields: upload.fields.bind(upload)
};
