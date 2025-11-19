// src/socket-io/handlers/chat.js


exports.chatEvents = (socket, io) => {
  // Group Chat Message
  socket.on("sendMessage", (msg) => {
    io.emit("message", msg);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
};



