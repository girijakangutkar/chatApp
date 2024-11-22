const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    firebaseUid: { type: String, required: true },
    name: String,
    about: String,
    phoneNumber: { type: String, required: true, unique: true },
    profileImage: String,
    createdAt: { type: Date, default: Date.now },
    chatThemes: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { _id: false }
);

module.exports = mongoose.model("User", userSchema);
