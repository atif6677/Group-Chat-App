// src/models/groupMessageModel.js
const { DataTypes } = require("sequelize");
const { db } = require("../utils/database");

exports.GroupMessage = db.define("GroupMessage", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  groupId: { type: DataTypes.INTEGER, allowNull: false },
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false }
});