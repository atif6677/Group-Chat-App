const { GroupMessage } = require("../../models/groupMessageModel");
const { User } = require("../../models/signupModel");

exports.groupChatEvents = (socket, io) => {
  // join a group room
  socket.on("join_group", (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`Socket ${socket.id} joined group_${groupId}`);
  });

  // leave group room (optional)
  socket.on("leave_group", (groupId) => {
    socket.leave(`group_${groupId}`);
    console.log(`Socket ${socket.id} left group_${groupId}`);
  });

  // receive a group message from client, persist and broadcast to room
  socket.on("group_message", async ({ groupId, senderId, text }) => {
    try {
      if (!groupId || !senderId || !text) return;

      // persist
      const saved = await GroupMessage.create({
        groupId,
        senderId,
        text
      });

      // fetch sender name
      const sender = await User.findByPk(senderId);

      const payload = {
        id: saved.id,
        groupId,
        senderId,
        senderName: sender?.name || "User",
        text: saved.text,
        ts: new Date(saved.createdAt).getTime()
      };

      io.to(`group_${groupId}`).emit("group_message", payload);
    } catch (err) {
      console.error("group_message handler error:", err);
    }
  });

  // optional: handle disconnect
  socket.on("disconnect", () => {
    // cleanup if needed
  });
};
