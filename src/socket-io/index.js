// src/socket-io/index.js

const socketAuth = require("./middleware");
const chatHandler = require("./handlers/chat");
const personalChat = require("./handlers/personalChat");

exports.initSocket = (server) => {
  const io = require("socket.io")(server, { cors: { origin: "*" } });

  io.use(socketAuth.authMiddleware);

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    chatHandler.chatEvents(socket, io);
    personalChat.personalChatEvents(socket, io);
  });

  return io;
};
