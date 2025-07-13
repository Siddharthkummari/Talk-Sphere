const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const verifyToken = require("./middleware/verifyToken");
require("dotenv").config();

const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

// Models
const Message = require("./models/Message");
const Room = require("./models/Room");
const Group = require("./models/Group");

// Middleware
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const registerRoute = require("./routes/register");
const loginRoute = require("./routes/login");
const profileRoute = require("./routes/profile");
const messagesRoute = require("./routes/messages");

app.use("/api/auth", registerRoute);
app.use("/api/auth", loginRoute);
app.use("/api/auth", profileRoute);
app.use("/api/messages", messagesRoute);

// Create Room Route
app.post("/create-room", async (req, res) => {
  const { name, createdBy } = req.body;

  const existingRoom = await Room.findOne({ name });
  if (existingRoom) {
    return res.status(400).json({ message: "Room name already exists" });
  }

  const roomId = uuidv4();
  const room = await Room.create({ name, roomId, createdBy });
  res.json(room);
});
 
// Get All Rooms Route
app.get("/rooms", async (req, res) => {
  const rooms = await Room.find({});
  res.json(rooms);
});


app.get("/groups", async (req, res) => {
   const groups = await Group.find({});
   res.json(groups);
});

// Socket.io logic
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("join_room", async (roomId) => {
    socket.join(roomId);
    const room = await Room.findOne({ roomId }).populate("messages");
    if (room) {
      socket.emit("room_messages", room.messages);
    }
  });
 
  socket.on("send_message", async ({ roomId, message ,userID}) => {
    try {
      const msg = new Message({ roomId, message, userID});
      await msg.save();

      await Room.findOneAndUpdate({ roomId }, { $push: { messages: msg._id } });

      io.to(roomId).emit("receive_message", msg);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  // message seen update
  socket.on("message_seen", async ({ roomId, userID }) => {
    try {
      const messages = await Message.find({ roomId });

      for (const msg of messages) {
        if (!msg.readBy.includes(userID)) {
          msg.readBy.push(userID);
          await msg.save();
        }
      }

      // Notify clients in the room about updated messages
      io.to(roomId).emit("messages_updated", await Message.find({ roomId }));
    } catch (err) {
      console.error("Error updating read status:", err);
    }
  });
  
  

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

// MongoDB connection
const MONGO_URI = "mongodb://127.0.0.1:27017/authDB";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
 