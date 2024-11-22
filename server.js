require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//models
const User = require("./models/User");

//Routes
const userRoutes = require("./routes/userRoutes");
const themeRoutes = require("./routes/themeRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const attachmentRoutes = require("./routes/attachmentRoutes");
const profileRoutes = require("./routes/profileRoutes");

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.use(profileRoutes);
app.use(conversationRoutes);
app.use(attachmentRoutes);
app.use(themeRoutes);
app.use(userRoutes);

//contact syncing
app.get("/api/users/search", async (req, res) => {
  try {
    const { phoneNumbers } = req.query;
    const phoneNumberList = phoneNumbers.split(",");
    const users = await User.find({ phoneNumber: { $in: phoneNumberList } });
    const userMap = users.reduce((acc, user) => {
      acc[user.phoneNumber] = user;
      return acc;
    }, {});
    res.json(userMap);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

//Socket connection
io.on("connection", (socket) => {
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room`);
  });

  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
    console.log(`User left room`);
  });

  socket.on("sendMessage", (messageData) => {
    io.in(messageData.conversationId).emit("newMessage", messageData);
  });

  socket.on("sendAttachment", (attachmentData) => {
    io.in(attachmentData.conversationId).emit("newAttachment", attachmentData);
  });

  // io.on("connection", (socket) => {
  //   socket.on("voiceChunk", (data) => {
  //     // Send to all clients in the room except sender
  //     socket.to(data.conversationId).emit("voiceChunk", data);
  //   });

  //   socket.on("joinRoom", (conversationId) => {
  //     socket.join(conversationId);
  //   });
  // });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

//Port connection
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
