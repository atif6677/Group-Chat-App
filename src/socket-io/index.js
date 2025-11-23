// src/socket-io/index.js
const socketAuth = require("./middleware");
const personalChat = require("./handlers/personalChat");
const groupChat = require("./handlers/groupChat");

exports.initSocket = (server) => {
  const io = require("socket.io")(server, {
    cors: { origin: "*" }
  });

  io.use(socketAuth.authMiddleware);

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    personalChat.personalChatEvents(socket, io);
    groupChat.groupChatEvents(socket, io);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};
