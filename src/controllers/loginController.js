// src/controllers/loginController.js
const User = require("../models/signupModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ error: "Email/Phone and password are required" });
    }

    // ✅ find user by email OR phone (fixed field name)
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials (user not found)" });
    }

    // ✅ compare password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials (wrong password)" });
    }

    // ✅ create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ✅ send success response with user info
    res.status(200).json({
      message: "Login successful",
      token,
      userId: user.id,
      name: user.name,
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = loginUser;
