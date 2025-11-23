// src/models/privateMessageModel.js
const { DataTypes } = require("sequelize");
const { db } = require("../utils/database");

exports.PrivateMessage = db.define("PrivateMessage", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  roomId: { type: DataTypes.STRING, allowNull: false },
  senderEmail: { type: DataTypes.STRING, allowNull: false },
  receiverEmail: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false }
});
