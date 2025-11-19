//src/socket-io/handlers/personalChat.js

const { User } = require("../../models/signupModel");
const { PrivateMessage } = require("../../models/privateMessageModel");

exports.personalChatEvents = (socket, io) => {
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined: ${roomId}`);
  });

  socket.on("new_message", async ({ roomId, senderEmail, receiverEmail, message }) => {
    try {
      if (!roomId || !senderEmail || !receiverEmail || !message.trim()) return;

      // Save to DB
      const saved = await PrivateMessage.create({
        roomId,
        senderEmail,
        receiverEmail,
        message
      });

      const sender = await User.findOne({ where: { email: senderEmail } });

      const payload = {
        roomId,
        senderEmail,
        senderName: sender?.name || senderEmail,
        receiverEmail,
        message,
        ts: new Date(saved.createdAt).getTime()
      };

      io.to(roomId).emit("new_message", payload);
    } catch (err) {
      console.error("Private message error:", err);
    }
  });
};
