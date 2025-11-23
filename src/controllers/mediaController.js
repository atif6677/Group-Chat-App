const { s3 } = require("../utils/s3Config");
const { v4: uuidv4 } = require("uuid");
const { User } = require("../models/signupModel");
const { Group } = require("../models/groupModel");
const { GroupMessage } = require("../models/groupMessageModel");
const { PrivateMessage } = require("../models/privateMessageModel");

exports.uploadMedia = async (req, res) => {
  try {
    const file = req.file;
    const { context, idOrUuid } = req.body; // context = 'private' or 'group'
    const senderId = req.user.userId;
    const senderEmail = req.user.email;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // 1. Upload to AWS S3
    const fileExtension = file.originalname.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL: 'public-read' // Enable this if your bucket isn't public by policy
    };

    const s3Response = await s3.upload(params).promise();
    const fileUrl = s3Response.Location; // The public URL of the file

    // 2. Handle Database & Socket Broadcast based on Context
    if (context === "group") {
      const groupUuid = idOrUuid;
      const group = await Group.findOne({ where: { uuid: groupUuid } });
      
      if (!group) return res.status(404).json({ error: "Group not found" });

      // Save to DB (storing URL in 'text' field for now, or use a new column)
      const savedMsg = await GroupMessage.create({
        groupId: group.id,
        senderId: senderId,
        text: fileUrl // Storing URL as the message text
      });

      const sender = await User.findByPk(senderId);

      // Broadcast via Socket
      const payload = {
        id: savedMsg.id,
        groupUuid: group.uuid,
        groupId: group.id,
        senderId,
        senderName: sender?.name || "User",
        text: fileUrl,
        ts: new Date().getTime(),
        isFile: true // Flag for frontend
      };

      req.io.to(`group_${groupUuid}`).emit("group_message", payload);

    } else if (context === "private") {
      const roomId = idOrUuid;
      const receiverEmail = req.body.receiverEmail;

      // Save to DB
      await PrivateMessage.create({
        roomId,
        senderEmail,
        receiverEmail,
        message: fileUrl
      });

      const sender = await User.findByPk(senderId);

      // Broadcast via Socket
      const payload = {
        roomId,
        senderEmail,
        senderName: sender?.name || senderEmail,
        receiverEmail,
        message: fileUrl,
        ts: new Date().getTime(),
        isFile: true
      };

      req.io.to(roomId).emit("new_message", payload);
    }

    res.status(200).json({ message: "File uploaded", url: fileUrl });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "File upload failed" });
  }
};