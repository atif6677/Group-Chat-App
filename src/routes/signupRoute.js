// src/routes/signupRoute.js

const express = require("express");
const router = express.Router();
const signup = require("../controllers/signupController");

router.post("/signup", signup.addUserSignup);

exports.router = router;
