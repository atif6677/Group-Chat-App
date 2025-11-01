// src/controllers/signupController.js
const User = require("../models/signupModel");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize"); 

const addUserSignup = async (req, res) => {
  try {
    // FIX: Destructure 'phoneNumber' to match frontend and model
    const { name, email, phoneNumber, password } = req.body;
    
    if (!name || !email || !password || !phoneNumber) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    // Check if email OR phone already exists
    const existingUser = await User.findOne({
      where: {
        // FIX: Use 'phoneNumber' in the check
        [Op.or]: [{ email: email }, { phoneNumber: phoneNumber }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: "Email already exists" });
      }
      // FIX: Use 'phoneNumber' in the check
      if (existingUser.phoneNumber === phoneNumber) {
        return res.status(400).json({ error: "Phone number already exists" });
      }
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the user
    const user = await User.create({
      name,
      email,
      phoneNumber, 
      password: hashedPassword,
    });

    // Send back the new user's details (excluding password)
    res.status(201).json({
      message: "New user added successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber, 
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = addUserSignup;