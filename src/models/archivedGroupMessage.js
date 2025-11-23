const { db } = require("../utils/database");
const { DataTypes } = require("sequelize");

const ArchivedGroupMessage = db.define("ArchivedGroupMessage", {
  id: { type: DataTypes.INTEGER, primaryKey: true }, // Keep original ID
  groupId: { type: DataTypes.INTEGER, allowNull: false },
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false }
});

exports.ArchivedGroupMessage = ArchivedGroupMessage;