// src/routes/userRoute.js
const express = require("express");
const { User } = require("../models/signupModel");
const { Op } = require("sequelize");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/users/search", auth, async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.json({ users: [] });
  }

  try {
    const users = await User.findAll({
      where: {
        email: { [Op.like]: `%${query}%` }
      },
      attributes: ["id", "name", "email"]
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

exports.router = router;
