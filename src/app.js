// src/app.js

require("dotenv").config(); 

const express = require("express");
const app = express();

const path = require("path");
const cors = require("cors");
const db = require("./utils/database");



// Routes
const signupRoutes = require("./routes/signupRoute");
const loginRoutes = require("./routes/loginRoute");



// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));


// API Routes
app.use("/", signupRoutes);
app.use("/", loginRoutes);


// Sync DB and start server
const PORT = process.env.PORT || 3000;

db.sync()
  .then(() => {
    console.log("Database synced");
    app.listen(PORT, () =>
      console.log(`Server running on port http://localhost:${PORT}/signup.html`)
    );
  })
  .catch((err) => console.error("DB sync error:", err));

module.exports = app;
