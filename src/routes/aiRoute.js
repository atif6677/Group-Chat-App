const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const aiController = require("../controllers/aiController");

router.post("/ai/predict", auth, aiController.getPrediction);
router.post("/ai/reply", auth, aiController.getSmartReplies);

exports.router = router;