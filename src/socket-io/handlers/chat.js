// src/socket-io/handlers/chat.js


exports.chatEvents = (socket, io) => {

  socket.on("sendMessage", (msg) => {
    io.emit("message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
};



