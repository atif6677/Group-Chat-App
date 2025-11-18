const express = require("express");
const http = require("http");
const { initSocket } = require("./socket-io/index");

const app = express();
const server = http.createServer(app);

initSocket(server);

server.listen(3000, () => {
    console.log("Server listening on 3000");
});
