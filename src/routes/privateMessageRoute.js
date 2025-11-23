// src/routes/privateMessageRoute.js
const express = require("express");
const { PrivateMessage } = require("../models/privateMessageModel");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/private/messages", auth, async (req, res) => {
  try {
    const { roomId } = req.query;

    if (!roomId) {
      return res.status(400).json({ error: "roomId is required" });
    }

    const messages = await PrivateMessage.findAll({
      where: { roomId },
      order: [["createdAt", "ASC"]]
    });

    res.json({ messages });
  } catch (err) {
    console.error("Error fetching private messages:", err);
    res.status(500).json({ error: "Failed to fetch private messages" });
  }
});

exports.router = router;
