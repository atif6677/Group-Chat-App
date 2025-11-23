// src/models/groupModel.js
const { DataTypes } = require("sequelize");
const { db } = require("../utils/database");

exports.Group = db.define("Group", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  createdBy: { type: DataTypes.INTEGER, allowNull: false }
});