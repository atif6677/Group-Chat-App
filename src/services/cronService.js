const cron = require("node-cron");
const { Op } = require("sequelize");
const { db } = require("../utils/database");

// Import Main Models
const { GroupMessage } = require("../models/groupMessageModel");
const { PrivateMessage } = require("../models/privateMessageModel");

// Import Archive Models
const { ArchivedGroupMessage } = require("../models/archivedGroupMessage");
const { ArchivedPrivateMessage } = require("../models/archivedPrivateMessage");

exports.startCronJobs = () => {
  // Schedule task to run every night at 12:00 AM (0 0 * * *)
  cron.schedule("0 0 * * *", async () => {
    console.log("🕒 Running Cron Job: Archiving old chat messages...");
    
    const t = await db.transaction(); // Start a transaction for safety

    try {
      // Define "Old": Anything older than 1 day
      const oneDayAgo = new Date(new Date() - 24 * 60 * 60 * 1000);

      // --- ARCHIVE GROUP MESSAGES ---
      const oldGroupMessages = await GroupMessage.findAll({
        where: { createdAt: { [Op.lt]: oneDayAgo } },
        transaction: t
      });

      if (oldGroupMessages.length > 0) {
        // 1. Bulk Insert into Archive
        const groupData = oldGroupMessages.map(m => m.toJSON());
        await ArchivedGroupMessage.bulkCreate(groupData, { transaction: t });

        // 2. Delete from Main Table
        const groupIds = oldGroupMessages.map(m => m.id);
        await GroupMessage.destroy({
          where: { id: groupIds },
          transaction: t
        });
        console.log(`✅ Archived & Deleted ${oldGroupMessages.length} Group Messages.`);
      }

      // --- ARCHIVE PRIVATE MESSAGES ---
      const oldPrivateMessages = await PrivateMessage.findAll({
        where: { createdAt: { [Op.lt]: oneDayAgo } },
        transaction: t
      });

      if (oldPrivateMessages.length > 0) {
        // 1. Bulk Insert into Archive
        const privateData = oldPrivateMessages.map(m => m.toJSON());
        await ArchivedPrivateMessage.bulkCreate(privateData, { transaction: t });

        // 2. Delete from Main Table
        const privateIds = oldPrivateMessages.map(m => m.id);
        await PrivateMessage.destroy({
          where: { id: privateIds },
          transaction: t
        });
        console.log(`✅ Archived & Deleted ${oldPrivateMessages.length} Private Messages.`);
      }

      await t.commit(); // Commit changes if everything succeeded
      console.log("🎉 Archiving Process Complete.");

    } catch (err) {
      await t.rollback(); // Undo everything if there was an error
      console.error("❌ Archiving Failed. Rolling back changes.", err);
    }
  });
};