// src/routes/messageRoute.js


const express = require("express");
const router = express.Router();
const msg = require("../controllers/messageController");
const { auth } = require("../middleware/auth");

router.post("/messages", auth, msg.addMessage);
router.get("/messages", auth, msg.getAllMessages);

exports.router = router;


