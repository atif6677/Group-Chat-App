// src/routes/messageRoute.js
const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

router.post("/messages", messageController.addMessage);
router.get("/messages", messageController.getAllMessages);

module.exports = router;
