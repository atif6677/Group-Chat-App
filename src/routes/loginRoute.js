// src/routes/loginRoute.js
const express = require("express");
const login = require("../controllers/loginController");

const router = express.Router();
router.post("/login", login.loginUser);

exports.router = router;
