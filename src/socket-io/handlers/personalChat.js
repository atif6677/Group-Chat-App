// src/socket-io/handlers/personalChat.js
const { User } = require("../../models/signupModel");
const { PrivateMessage } = require("../../models/privateMessageModel");

exports.personalChatEvents = (socket, io) => {
  // join personal room
  socket.on("join_room", (roomId) => {
    if (!roomId || typeof roomId !== "string" || roomId.includes("undefined")) {
      console.warn("Ignored join_room invalid:", roomId);
      return;
    }
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined personal room ${roomId}`);
  });

  // handle personal message
  socket.on("new_message", async ({ roomId, senderEmail, receiverEmail, message, roomDisplay }) => {
    try {
      if (!roomId || !senderEmail || !receiverEmail || !message?.trim()) {
        console.warn("new_message missing fields");
        return;
      }

      // Save to DB
      await PrivateMessage.create({ roomId, senderEmail, receiverEmail, message });

      const sender = await User.findOne({ where: { email: senderEmail } });

      const payload = {
        roomId,
        senderEmail,
        senderName: sender?.name || senderEmail,
        receiverEmail,
        message,
        roomDisplay: roomDisplay || null,
        ts: Date.now()
      };

      // Emit to room
      io.to(roomId).emit("new_message", payload);
    } catch (err) {
      console.error("personalChat new_message error:", err);
    }
  });
};
