//src/models/messageModel.js

const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");
const User = require("./signupModel");

const Message = sequelize.define("Message", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  message: { type: DataTypes.TEXT, allowNull: false }
});

Message.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
User.hasMany(Message, { foreignKey: "userId" });

exports.Message = Message;

