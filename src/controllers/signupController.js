// src/controllers/signupController.js
const User = require("../models/signupModel");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");

exports.addUserSignup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { phone }] },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: "Email already exists" });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({ error: "Phone number already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name, email, phone, password: hashedPassword,
    });

    res.status(201).json({
      message: "New user added successfully",
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};
