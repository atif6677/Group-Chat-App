// src/app.js

require("dotenv").config();

const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const db = require("./utils/database");

// Import Routes
const signupRoutes = require("./routes/signupRoute");
const loginRoutes = require("./routes/loginRoute");
const messageRoutes = require("./routes/messageRoute"); // ✅ corrected file name

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public"))); // serve frontend files

// API Routes
app.use("/api", signupRoutes);
app.use("/api", loginRoutes);
app.use("/api", messageRoutes);


// Root route (optional)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/signup.html"));
});

// Sync DB and start server
const PORT = process.env.PORT || 3000;

db.sync()
  .then(() => {
    console.log("✅ Database synced successfully");
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}/signup.html`)
    );
  })
  .catch((err) => console.error("❌ DB sync error:", err));

module.exports = app;
