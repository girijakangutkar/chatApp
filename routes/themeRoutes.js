const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/api/user/set-chat-theme", async (req, res) => {
  try {
    const { userId, otherUserId, theme } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Ensure chatThemes is initialized if it doesn't exist
    if (!user.chatThemes) {
      user.chatThemes = new Map();
    }

    user.chatThemes.set(otherUserId, theme);
    await user.save();

    // console.log(
    //   `Theme set for user ${userId} with other user ${otherUserId}: ${theme}`
    // );
    res.json({ message: "Chat theme updated successfully", theme });
  } catch (error) {
    console.error("Error setting chat theme:", error);
    res.status(500).json({ error: "Failed to set chat theme" });
  }
});

// Update the route to get the chat theme
router.get("/api/user/chat-theme/:userId/:otherUserId", async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const theme = user.chatThemes
      ? user.chatThemes.get(otherUserId)
      : undefined;
    // console.log(
    //   `Retrieved theme for user ${userId} with other user ${otherUserId}: ${
    //     theme || "default"
    //   }`
    // );
    res.json({ theme: theme || "default" });
  } catch (error) {
    console.error("Error getting chat theme:", error);
    res.status(500).json({ error: "Failed to get chat theme" });
  }
});

module.exports = router;
