const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  name: String,
  roomId: { type: String, unique: true },
  createdBy: String,
  createdAt: { type: Date, default: Date.now },

  // 👇 Add messages array
  messages: [
    {
      userID: String,
      message: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Room", roomSchema);
