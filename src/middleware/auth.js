// src/middleware/auth.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

exports.auth = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const parts = token.split(" ");
    // Check for "Bearer <token>" format
    if (parts[0] !== "Bearer" || parts.length !== 2) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};
