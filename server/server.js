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

  // --- WebRTC Signaling Events ---

  // 1. Initiate a call
  socket.on("call-user", ({ to, from, intentObject, offer }) => {
    const targetSocketId = phonebook.get(to);
    if (targetSocketId) {
      console.log(`[Cooee Echo] Call from ${from} to ${to}`);
      io.to(targetSocketId).emit("incoming-call", { from, to, intentObject, offer });
    } else {
      console.log(`[Cooee Echo] Call failed: ${to} is not registered`);
      socket.emit("call-error", { message: "Number offline or not registered" });
    }
  });

  // 2. Accept a call
  socket.on("answer-call", ({ to, from, answer }) => {
    const targetSocketId = phonebook.get(to); // "to" here is the original caller
    if (targetSocketId) {
      console.log(`[Cooee Echo] Call answered by ${from}`);
      io.to(targetSocketId).emit("call-accepted", { from, answer });
    }
  });

  // 3. Relay ICE candidates
  socket.on("ice-candidate", ({ to, from, candidate }) => {
    const targetSocketId = phonebook.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { from, candidate });
    }
  });

  // 4. End an active call
  socket.on("end-call", ({ to, from }) => {
    const targetSocketId = phonebook.get(to);
    if (targetSocketId) {
      console.log(`[Cooee Echo] Call ended by ${from}`);
      io.to(targetSocketId).emit("call-ended", { from });
    }
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
