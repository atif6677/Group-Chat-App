// src/socket-io/handlers/groupChat.js
const { Group } = require("../../models/groupModel");
const { GroupMessage } = require("../../models/groupMessageModel");
const { User } = require("../../models/signupModel");

exports.groupChatEvents = (socket, io) => {
  // Join Group
  socket.on("join_group", async (groupUuid) => {
    try {
      if (!groupUuid) return;
      const group = await Group.findOne({ where: { uuid: groupUuid } });
      
      if (!group) {
        console.warn(`join_group: group not found ${groupUuid}`);
        return;
      }
      
      const roomName = `group_${groupUuid}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined ${roomName}`);
    } catch (err) {
      console.error("join_group error:", err);
    }
  });

  // Group Message
  socket.on("group_message", async ({ groupUuid, senderId, text }) => {
    try {
      if (!groupUuid || !senderId || !text?.trim()) return;

      const group = await Group.findOne({ where: { uuid: groupUuid } });
      if (!group) return;

      // Save to DB
      const saved = await GroupMessage.create({
        groupId: group.id,
        senderId,
        text
      });

      const sender = await User.findByPk(senderId);

      const payload = {
        id: saved.id,
        groupUuid: group.uuid,
        groupId: group.id,
        senderId,
        senderName: sender?.name || "User",
        text: saved.text,
        ts: new Date(saved.createdAt).getTime()
      };

      // Emit to group room
      io.to(`group_${group.uuid}`).emit("group_message", payload);
    } catch (err) {
      console.error("group_message handler error:", err);
    }
  });
};