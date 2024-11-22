const express = require("express");
const router = express.Router();
const User = require("../models/User");

const Conversation = require("../models/Conversation");

router.post("/api/messages", async (req, res) => {
  try {
    const { _id, conversationId, senderId, content, timestamp } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const newMessage = {
      _id,
      senderId,
      content,
      timestamp,
    };

    conversation.messages.push(newMessage);
    await conversation.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ error: "Failed to save message" });
  }
});

router.post("/api/conversations", async (req, res) => {
  try {
    const { participants } = req.body;

    if (
      !participants ||
      !Array.isArray(participants) ||
      participants.length !== 2
    ) {
      return res
        .status(400)
        .json({ error: "Exactly two valid participants are required" });
    }

    const users = await User.find({
      $or: [
        { _id: { $in: participants } },
        { firebaseUid: { $in: participants } },
      ],
    });

    if (users.length !== 2) {
      return res.status(404).json({ error: "One or both users not found" });
    }

    const participantIds = users.map((user) => user._id);

    let conversation = await Conversation.findOne({
      participants: { $all: participantIds },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: participantIds,
        messages: [],
      });
      await conversation.save();
    }

    res.json(conversation);
  } catch (error) {
    console.error("Error starting/getting conversation:", error);
    res.status(500).json({
      error: "Failed to start/get conversation",
      details: error.message,
    });
  }
});

router.get("/api/messages/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    res.json(conversation.messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.get("/api/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalConversations = await Conversation.countDocuments({
      participants: userId,
    });
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "name profileImage")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedConversations = conversations
      .map((conv) => {
        const otherUser = conv.participants.find(
          (p) => p && p._id && p._id.toString() !== userId
        );

        if (!otherUser) {
          // console.error(`No other user found for conversation: ${conv._id}`);
          return null;
        }

        const lastMessage = conv.messages[conv.messages.length - 1];
        return {
          _id: conv._id,
          otherUserId: otherUser._id,
          otherUserName: otherUser.name || "Unknown User",
          otherUserProfilePic: otherUser.profileImage
            ? `${req.protocol}://${req.get("host")}/${otherUser.profileImage}`
            : null,
          lastMessage: lastMessage ? lastMessage.content : "",
          lastMessageTime: lastMessage ? lastMessage.timestamp : conv.updatedAt,
        };
      })
      .filter(Boolean); // Remove any null entries

    res.json({
      conversations: formattedConversations,
      hasMore: totalConversations > skip + conversations.length,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

module.exports = router;
