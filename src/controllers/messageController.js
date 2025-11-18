// src/controllers/messageController.js
const Message = require("../models/messageModel");
const User = require("../models/signupModel");

exports.addMessage = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message.trim()) {
      return res.status(400).json({ error: "userId and message are required" });
    }

    // 1. Save to DB
    const newMsg = await Message.create({ userId, message });

    // 2. Fetch the user's name (needed for the frontend display)
    const user = await User.findByPk(userId);

    // 3. Construct the payload for the socket
    const socketPayload = {
        id: newMsg.id,
        userId: newMsg.userId,
        name: user ? user.name : "User",
        text: newMsg.message,
        ts: new Date(newMsg.createdAt).getTime(),
    };

    // 4. Emit to ALL clients
    req.io.emit("message", socketPayload);

    res.status(201).json({ message: "Message saved", chat: newMsg });
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ error: "Failed to save message" });
  }
};

exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.findAll({
      include: [{ model: User, attributes: ["name", "email"] }],
      order: [["createdAt", "ASC"]],
    });
    res.status(200).json({ messages });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};