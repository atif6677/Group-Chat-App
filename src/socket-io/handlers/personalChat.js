//src/socket-io/handlers/personalChat.js

const { User } = require("../../models/signupModel");

exports.personalChatEvents = (socket, io) => {

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined: ${roomId}`);
  });

  socket.on("new_message", async ({ roomId, senderEmail, receiverEmail, message }) => {

    const sender = await User.findOne({ where: { email: senderEmail } });

    const payload = {
      roomId,
      senderEmail,
      senderName: sender ? sender.name : "Unknown",
      receiverEmail,
      message,
      ts: Date.now()
    };

    io.to(roomId).emit("new_message", payload);
  });
};


