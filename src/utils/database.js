// src/utils/database.js

const { Sequelize } = require("sequelize");

// Initialize Sequelize
exports.db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql",
    logging: false // Set to console.log if you want to see SQL queries
  }
);
