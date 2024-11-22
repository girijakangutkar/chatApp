const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const dir = path.join(__dirname, "uploads");
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
  limits: { fileSize: 31_457_280 }, //30 MB size limit
});

router.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { conversationId, senderId } = req.body;
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;

    const newMessage = {
      _id: new mongoose.Types.ObjectId(),
      senderId,
      type: "attachment",
      content: `File: ${req.file.originalname}`,
      fileUrl,
      fileName: req.file.originalname,
      timestamp: new Date().toISOString(),
    };

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    conversation.messages.push(newMessage);
    await conversation.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error uploading file:", error);
    res
      .status(500)
      .json({ error: "Failed to upload file", details: error.message });
  }
});

router.get("/uploads/:filename", async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);

  try {
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error accessing file:", error);
    res.status(404).json({ error: "File not found" });
  }
});

module.exports = router;
