const { DataTypes } = require("sequelize");
const sequelize = require("../utils/database");
const User = require("./signupModel"); // import User to create relation

const Message = sequelize.define("Message", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

// Relation: each message belongs to a user
Message.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
User.hasMany(Message, { foreignKey: "userId" });

module.exports = Message;
