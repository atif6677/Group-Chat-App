const { db } = require("../utils/database");
const { DataTypes } = require("sequelize");

const Group = db.define("Group", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  createdBy: { type: DataTypes.INTEGER, allowNull: false } // store userId of creator
});

exports.Group = Group;
