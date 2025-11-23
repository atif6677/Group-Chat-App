// src/routes/groupRoute.js
const express = require("express");
const { Group } = require("../models/groupModel");
const { GroupMessage } = require("../models/groupMessageModel");
const { User } = require("../models/signupModel");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Create group
router.post("/groups", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Group name required" });

    const group = await Group.create({ name, createdBy: req.user.userId });
    res.status(201).json({ group });
  } catch (err) {
    console.error("Create group error:", err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// List groups
router.get("/groups", auth, async (req, res) => {
  try {
    const groups = await Group.findAll({ order: [["createdAt", "DESC"]] });
    res.json({ groups });
  } catch (err) {
    console.error("List groups error:", err);
    res.status(500).json({ error: "Failed to list groups" });
  }
});

// Get group messages
router.get("/groups/:uuid/messages", auth, async (req, res) => {
  try {
    const { uuid } = req.params;
    const group = await Group.findOne({ where: { uuid } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    const messages = await GroupMessage.findAll({
      where: { groupId: group.id },
      order: [["createdAt", "ASC"]]
    });

    // Enrich messages with Sender Name
    const enriched = await Promise.all(messages.map(async (m) => {
      const user = await User.findByPk(m.senderId);
      return {
        id: m.id,
        groupId: m.groupId,
        senderId: m.senderId,
        senderName: user?.name || "User",
        text: m.text,
        createdAt: m.createdAt
      };
    }));

    res.json({ messages: enriched });
  } catch (err) {
    console.error("Get group messages error:", err);
    res.status(500).json({ error: "Failed to fetch group messages" });
  }
});

exports.router = router;
