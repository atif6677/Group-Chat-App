const Message = require("../models/messageModel");
const User = require("../models/signupModel");

exports.addMessage = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message.trim()) {
      return res.status(400).json({ error: "userId and message are required" });
    }

    const newMsg = await Message.create({ userId, message });
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
