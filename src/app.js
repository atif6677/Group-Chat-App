//src/app.js

require("dotenv").config();


const express = require("express");
const http = require("http");
const path = require("path");
const { initSocket } = require("./socket-io/index");
const { db } = require("./utils/database");

// ROUTES
const signupRoute = require("./routes/signupRoute").router;
const loginRoute = require("./routes/loginRoute").router;
const messageRoute = require("./routes/messageRoute").router;
const userRoute = require("./routes/userRoute").router;
const groupRoute = require("./routes/groupRoute").router;
const privateMessageRoute = require("./routes/privateMessageRoute").router;





const app = express();
const server = http.createServer(app);

// SOCKET.IO INIT
const io = initSocket(server);

// Attach io to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static frontend
app.use(express.static(path.join(__dirname, "..", "public")));


// API Routes
app.use("/api", signupRoute);
app.use("/api", loginRoute);
app.use("/api", messageRoute);
app.use("/api", userRoute);
app.use("/api", groupRoute);
app.use("/api", privateMessageRoute);


// Database Sync + Start Server
async function startServer() {
  try {
    await db.authenticate();
    console.log("Database connected");

    await db.sync();
    console.log("Tables synced");

    server.listen(3000, () => {
      console.log("Server running on http://localhost:3000/signup.html");
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
}

startServer();
