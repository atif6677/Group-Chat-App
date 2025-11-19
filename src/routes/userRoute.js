//src/routes/userRoute.js
const express = require("express");
const router = express.Router();
const { User } = require("../models/signupModel");
const { Op } = require("sequelize");
const { auth } = require("../middleware/auth");

router.get("/users/search", auth, async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.json({ users: [] });
  }

  const users = await User.findAll({
    where: {
      email: { [Op.like]: `%${query}%` }
    },
    attributes: ["id", "name", "email"]
  });

  res.json({ users });
});

exports.router = router;

