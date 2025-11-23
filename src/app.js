require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const { initSocket } = require("./socket-io/index");
const { db } = require("./utils/database");
const { startCronJobs } = require("./services/cronService");

// ROUTES IMPORTS
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

// Attach io for controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files
app.use(express.static(path.join(__dirname, "..", "public")));

// API Routes
app.use("/api", signupRoute);
app.use("/api", loginRoute);
app.use("/api", userRoute);
app.use("/api", groupRoute);
app.use("/api", privateMessageRoute);
app.use("/api", mediaRoute);

// Start Server + Cron
async function startServer() {
  try {
    await db.authenticate();
    console.log("Database connected");

    await db.sync();
    console.log("Tables synced");

    // ⏳ START CRON JOB HERE
    try {
      startCronJobs();
      console.log("⏳ Cleanup Cron Started");
    } catch (cronErr) {
      console.error("Cron failed to start:", cronErr);
    }

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}/login.html`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
}

startServer();
