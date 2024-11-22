const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/api/auth/check-user", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const user = await User.findOne({ phoneNumber });
    if (user) {
      res.json({ userExists: true, user });
    } else {
      res.json({ userExists: false });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/api/user", async (req, res) => {
  try {
    let { phoneNumber } = req.query;
    phoneNumber = phoneNumber.replace(/^\+|\s/g, "");

    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = await User.findOne({ phoneNumber: `+${phoneNumber}` });
    }

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
