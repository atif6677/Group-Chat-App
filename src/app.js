// src/app.js
require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const { initSocket } = require("./socket-io/index");
const { db } = require("./utils/database");

// ROUTES IMPORTS (Using the .router property we exported)
const signupRoute = require("./routes/signupRoute").router;
const loginRoute = require("./routes/loginRoute").router;
const userRoute = require("./routes/userRoute").router;
const groupRoute = require("./routes/groupRoute").router;
const privateMessageRoute = require("./routes/privateMessageRoute").router;
const mediaRoute = require("./routes/mediaRoute").router;

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

// STATIC FILES
// IMPORTANT: This assumes your 'public' folder is one level up from 'src'
app.use(express.static(path.join(__dirname, "..", "public")));

// API Routes
app.use("/api", signupRoute);
app.use("/api", loginRoute);
app.use("/api", userRoute);
app.use("/api", groupRoute);
app.use("/api", privateMessageRoute);
app.use("/api", mediaRoute);

// Database Sync + Start Server
async function startServer() {
  try {
    await db.authenticate();
    console.log("Database connected");

    // NOTE: In production, avoid { force: true } or { alter: true } unless you want to reset tables
    await db.sync(); 
    console.log("Tables synced");

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}/login.html`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
}

startServer();