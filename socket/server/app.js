const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const Room = require("./models/Room");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5174", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/chatApp");

// Create new room
app.post("/create-room", async (req, res) => {
  const { name, createdBy } = req.body;

  // Check if room name already exists
 const existingRoom = await Room.findOne({
   name
 });

  if (existingRoom) {
    return res.status(400).json({ message: "Room name already exists" });
  }

  const roomId = uuidv4();
  const room = await Room.create({ name, roomId, createdBy });
  res.json(room);
});


// Get all rooms
app.get("/rooms", async (req, res) => {
  const rooms = await Room.find().sort({ createdAt: -1 });
  res.json(rooms);
});

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // Join a room and send message history
  socket.on("join_room", async (roomId) => {
    socket.join(roomId);
    const room = await Room.findOne({ roomId });
    if (room) {
      socket.emit("room_messages", room.messages); // send previous messages
    }
  });


  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("✅ Server running on http://localhost:3001");
});
