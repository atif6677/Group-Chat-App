// src/socket-io/index.js
const socketAuth = require("./middleware");
const chatHandler = require("./handlers/chat");

exports.initSocket = (server) => {
    const io = require("socket.io")(server, {
        cors: { origin: "*" }
    });

    io.use(socketAuth.authMiddleware);

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        chatHandler.chatEvents(socket, io);
    });

    return io;
};
