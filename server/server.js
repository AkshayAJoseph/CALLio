const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Enable permissive CORS for the hackathon
app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// In-memory phonebook: phoneNumber -> socket.id
const phonebook = new Map();
// Reverse lookup: socket.id -> phoneNumber
const reversePhonebook = new Map();

// Health check endpoint for deployment monitoring
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    registeredUsers: Array.from(phonebook.keys()),
  });
});

io.on("connection", (socket) => {
  console.log(`[Cooee Echo] Client connected: ${socket.id}`);

  // Register a virtual number to this socket
  socket.on("register", (phoneNumber) => {
    phonebook.set(phoneNumber, socket.id);
    reversePhonebook.set(socket.id, phoneNumber);
    console.log(`[Cooee Echo] Registered ${phoneNumber} to ${socket.id}`);
    
    // Broadcast updated list to everyone
    io.emit("online-numbers", Array.from(phonebook.keys()));
  });

  // Handle disconnects
  socket.on("disconnect", () => {
    const phoneNumber = reversePhonebook.get(socket.id);
    if (phoneNumber) {
      phonebook.delete(phoneNumber);
      reversePhonebook.delete(socket.id);
      console.log(`[Cooee Echo] Unregistered ${phoneNumber} (${socket.id})`);
      
      // Broadcast updated list to everyone
      io.emit("online-numbers", Array.from(phonebook.keys()));
    }
    console.log(`[Cooee Echo] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`[Cooee Echo] Signaling Server running on port ${PORT}`);
});
