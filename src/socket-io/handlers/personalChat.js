exports.personalChatEvents = (socket, io) => {

  // Join a personal room
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Handle personal message
  socket.on("new_message", ({ roomId, senderId, receiverId, message }) => {
    const payload = {
      roomId,
      senderId,
      receiverId,
      message,
      ts: Date.now()
    };

    // Emit only to this room
    io.to(roomId).emit("receive_message", payload);
  });

};
