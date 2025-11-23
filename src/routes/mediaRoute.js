const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { upload } = require("../middleware/uploadMiddleware");
const mediaController = require("../controllers/mediaController");

// Route: POST /api/upload
// Expects 'file' field in form-data
router.post("/upload", auth, upload.single("file"), mediaController.uploadMedia);

exports.router = router;