//src/models/messageModel.js


const { DataTypes } = require("sequelize");
const { db } = require("../utils/database");
const { User } = require("./signupModel");

const Message = db.define("Message", {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  message: { 
    type: DataTypes.TEXT, 
    allowNull: false 
  }
});

// Associations
Message.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
User.hasMany(Message, { foreignKey: "userId" });

exports.Message = Message;


