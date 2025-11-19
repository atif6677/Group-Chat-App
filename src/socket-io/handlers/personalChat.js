//src/socket-io/handlers/personalChat.js
exports.personalChatEvents = (socket, io) => {

  // Join a personal room
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Handle personal message
  socket.on("new_message", ({ roomId, senderEmail, receiverEmail, message }) => {

    const payload = {
      roomId,
      senderEmail,
      receiverEmail,
      message,
      ts: Date.now()
    };

    // Send only to people in the room
    io.to(roomId).emit("new_message", payload);
  });
};

