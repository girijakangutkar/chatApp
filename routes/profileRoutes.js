const express = require("express");
const router = express.Router();
const User = require("../models/User");
const path = require("path");
const multer = require("multer");
const fs = require("fs").promises;

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const dir = path.join(__dirname, "../uploads");
    try {
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 31_457_280 },
});

router.post(
  "/api/update-profile",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const { _id, phoneNumber, name, about } = req.body;
      const profileImage = req.file ? `uploads/${req.file.filename}` : null;

      let user = await User.findOne({ phoneNumber });

      if (user) {
        user.name = name || user.name;
        user.about = about || user.about;
        if (profileImage) {
          user.profileImage = profileImage;
        }
      } else {
        user = new User({
          _id, // Use the provided _id
          firebaseUid: _id, // Use _id as firebaseUid
          phoneNumber,
          name,
          about,
          profileImage,
        });
      }

      await user.save();
      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    }
  }
);

module.exports = router;
