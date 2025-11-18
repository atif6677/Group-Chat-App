// src/routes/messageRoute.js

const express = require("express");
const router = express.Router();
const msg = require("../controllers/messageController");

router.post("/messages", msg.addMessage);
router.get("/messages", msg.getAllMessages);

exports.router = router;

