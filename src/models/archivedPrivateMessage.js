const { DataTypes } = require("sequelize");
const { db } = require("../utils/database");

const ArchivedPrivateMessage = db.define("ArchivedPrivateMessage", {
  id: { type: DataTypes.INTEGER, primaryKey: true }, // Keep original ID
  roomId: { type: DataTypes.STRING, allowNull: false },
  senderEmail: { type: DataTypes.STRING, allowNull: false },
  receiverEmail: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false }
});

exports.ArchivedPrivateMessage = ArchivedPrivateMessage;