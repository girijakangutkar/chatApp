const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  senderId: { type: String, required: true },
  type: { type: String, default: "text" },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  attachmentUrl: String,
  attachmentType: String,
  fileUrl: String,
  fileName: String,
});

const ConversationSchema = new mongoose.Schema(
  {
    participants: [{ type: String, ref: "User" }],
    messages: [MessageSchema],
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

module.exports = mongoose.model("Conversation", ConversationSchema);
