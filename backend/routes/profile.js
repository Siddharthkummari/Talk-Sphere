const express = require("express");
const router = express.Router();
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const Group = require("../models/Group"); // Import Group model
const Room = require("../models/Room");
const Message = require("../models/Message");
const { v4: uuidv4 } = require("uuid");



const SECRET_KEY = "your_secret_key";

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
 
// ✅ GET: User Profile
// ✅ GET: User Profile by Email
router.get("/profile/:email", verifyToken, async (req, res) => {
  try {
    const email = req.params.email;

    const user = await User.findOne({ email })
      .select("-password")
      .populate("groups"); // Populate group details

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// GET /messages/latest/:roomId

router.get("/messages/latest/:roomId", async (req, res) => {
  try {
    const latest = await Message.findOne({ roomId: req.params.roomId })
      .sort({ createdAt: -1 })
      .lean();

    if (latest) {
      res.json({
        message: latest.message,
        userID: latest.userID || "Unknown", // Send only the userID (email or identifier)
      });
    } else {
      res.json({ message: "", userID: "Unknown" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch latest message" });
  }
});



// for notification unread messages 
// GET /messages/unread/:roomId/:userEmail
router.get("/messages/unread/:roomId/:userEmail", async (req, res) => {
  const { roomId, userEmail } = req.params;
  try {
    const unreadMessages = await Message.find({
      roomId,
      userID: { $ne: userEmail }, // Exclude messages sent by the user themselves
      readBy: { $ne: userEmail }, // Not yet read by the user
    });

    res.json({ count: unreadMessages.length });
  } catch (err) {
    console.error("Error fetching unread messages:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});





// ✅ POST: Add Friend
router.post("/addfriend", verifyToken, async (req, res) => {
  try {
    const friendEmail = req.body.email;
    console.log("Friend Email:", friendEmail);
    console.log("User ID from token:", req.userId);

    if (!friendEmail) {
      return res.status(400).json({ message: "Friend email required" });
    }

    const user = await User.findById(req.userId);
    const friend = await User.findOne({ email: friendEmail });

    if (!user) {
      console.log("User not found for ID:", req.userId);
      return res.status(404).json({ message: "User not found" });
    }

    if (!friend) {
      console.log("Friend not found for email:", friendEmail);
      return res.status(404).json({ message: "Friend not found" });
    }

    if (user.friends.includes(friendEmail)) {
      return res.status(400).json({ message: "Already friends" });
    }

    user.friends.push(friendEmail);
    await user.save();
    

    console.log("Friend added successfully:", friendEmail);
    res.status(200).json({ message: "Friend added successfully" });
  } catch (err) {
    console.error("Add friend error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ POST: Create group

router.post("/createGroup", verifyToken, async (req, res) => {
  try {
    const { friendsArray, groupName } = req.body; // Destructure to get both `friendsArray` and `groupName`
    console.log("Friend Emails:", friendsArray);
    console.log("User ID from token:", req.userId);

    // Ensure the group name is provided
    if (!groupName || groupName.trim().length === 0) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Ensure at least one friend is selected
    if (friendsArray.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one friend's email is required" });
    }

    // Find the user who is creating the group
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate each friend's email in the friends array
    const validFriends = await User.find({ email: { $in: friendsArray } });
    const invalidFriends = friendsArray.filter(
      (friendEmail) =>
        !validFriends.some((friend) => friend.email === friendEmail)
    );

    if (invalidFriends.length > 0) {
      return res
        .status(400)
        .json({
          message: `Friend(s) with email(s) ${invalidFriends.join(
            ", "
          )} not found`,
        });
    }

    const roomName = req.body.roomName;
    const createdBy = req.body.createdBy;
    
      const existingRoom = await Room.findOne({ roomName });
      if (existingRoom) {
        return res.status(400).json({ message: "Room name already exists" });
      }
    
      const roomId = uuidv4();
      const room = await Room.create({ name: roomName, roomId, createdBy });
      res.json(room);

    // Create the new group with the passed group name
    const newGroup = new Group({
      name: groupName, // Use the group name from the frontend
      roomId: roomId, // Generate a random roomId
      createdBy: req.userId,
      members: [req.userId, ...validFriends.map((friend) => friend._id)], // Add user and friends to group
    });

    // Save the group
    await newGroup.save();

    // Add the group to the user's groups array and the friends' groups array
    user.groups.push(newGroup._id);
    await user.save();

    for (const friend of validFriends) {
      friend.groups.push(newGroup._id);
      await friend.save();
    }
 
    // Respond with success and the new group details
    res.status(201).json({
      message: "Group created successfully",
      group: newGroup,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Server error, please try again later" });
  }
});

module.exports = router;
