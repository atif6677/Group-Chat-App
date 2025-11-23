const multer = require("multer");

// Store file in memory (RAM) temporarily so we can send it to S3
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept images, videos, and PDFs
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

exports.upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limit to 10MB
});