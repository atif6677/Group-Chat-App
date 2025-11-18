// src/app.js
require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const db = require("./utils/database");

// 1. Import http and socket.io
const http = require("http");
const { Server } = require("socket.io");

const app = express();

// 2. Create the HTTP server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connection from any origin (adjust for production)
  },
});

// Import Routes
const signupRoutes = require("./routes/signupRoute");
const loginRoutes = require("./routes/loginRoute");
const messageRoutes = require("./routes/messageRoute");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// 3. Middleware to make 'io' available in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use("/api", signupRoutes);
app.use("/api", loginRoutes);
app.use("/api", messageRoutes);

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/signup.html"));
});

// 4. Socket.io Connection Event (Optional: for logging)
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Sync DB and start server
const PORT = process.env.PORT || 3000;

db.sync()
  .then(() => {
    console.log("✅ Database synced successfully");
    // 5. CHANGE: Listen using 'server', not 'app'
    server.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}/signup.html`)
    );
  })
  .catch((err) => console.error("❌ DB sync error:", err));

module.exports = app;