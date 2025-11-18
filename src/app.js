// src/app.js
require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken"); // 💡 Import JWT
const User = require("./models/signupModel"); // 💡 Import User Model
const db = require("./utils/database");

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ... (Existing Express Middleware & Routes) ...
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// 🛑 SOCKET.IO AUTH MIDDLEWARE (Add this BEFORE io.on connection)
io.use(async (socket, next) => {
    try {
        // 1. Extract token from the handshake
        const token = socket.handshake.auth.token;
        
        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        // 2. Verify the token (Make sure 'secretkey' matches what you used in loginRoute)
        // Ideally use: process.env.JWT_SECRET
        const decoded = jwt.verify(token, "secretkey"); 

        // 3. Find the user in the DB (Optional but recommended for safety)
        const user = await User.findByPk(decoded.userId);
        if (!user) {
            return next(new Error("Authentication error: User not found"));
        }

        // 4. Attach user info to the socket instance
        // Now you can access socket.user.id or socket.user.name in any event!
        socket.user = user; 
        
        next(); // Allow connection
    } catch (err) {
        console.error("Socket Auth Error:", err.message);
        next(new Error("Authentication error: Invalid token"));
    }
});

// ... (Existing Routes) ...
const signupRoutes = require("./routes/signupRoute");
const loginRoutes = require("./routes/loginRoute");
const messageRoutes = require("./routes/messageRoute");

// Attach io to request for API routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api", signupRoutes);
app.use("/api", loginRoutes);
app.use("/api", messageRoutes);

// ... (Root route) ...

// ✅ UPDATED CONNECTION HANDLER
io.on("connection", (socket) => {
  // Now we know EXACTLY who this is
  console.log(`✅ User connected: ${socket.user.name} (ID: ${socket.user.id})`);

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.user.name}`);
  });
});

// ... (DB Sync and Server Listen) ...
const PORT = process.env.PORT || 3000;
db.sync()
  .then(() => {
    server.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}/signup.html`)
    );
  })
  .catch((err) => console.error("❌ DB sync error:", err));

module.exports = app;