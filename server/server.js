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

// Health check endpoint for deployment monitoring
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    // In later commits, we'll expose registeredUsers from the phonebook here
    registeredUsers: []
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`[Cooee Echo] Signaling Server running on port ${PORT}`);
});
