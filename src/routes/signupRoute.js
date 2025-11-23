// src/routes/signupRoute.js
const express = require("express");
const signup = require("../controllers/signupController");

const router = express.Router();
router.post("/signup", signup.addUserSignup);

exports.router = router;