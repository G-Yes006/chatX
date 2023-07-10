import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';
import chalk from 'chalk';
import connectDB from './config/db.js';
// import { validateMessage } from './validation.js';
import Message from './models/chat.js';
import User from './models/user.js';

dotenv.config();
import { validateMessage } from "./hooks/validators.js";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

app.use(bodyParser.json());

// Serve static files from the public directory
app.use(express.static("public"));

// Store connected users
import connectDB from "./config/db.js";

app.use(bodyParser.json());

// Serve static files from the public directory
app.use(express.static("public"));

// Store connected users
const users = {};

// Connect to MongoDB
connectDB();

// Import Message model
import Message from "./models/chat.js";

// Handle socket connections
io.on("connection", (socket) => {
  console.log(chalk.green("A user connected"));

  // Generate a unique user ID
  const userId = uuidv4();

  // Store the user ID in the socket object
  socket.userId = userId;

  // Add the user to the connected users object
  users[userId] = socket;

  // Notify all connected users about the new user
  io.emit("user connected", userId);

  // Listen for chat messages
  socket.on("chat message", (message) => {
    console.log(chalk.yellow("Message received:"), message);

    // Validate the message
    const { error } = validateMessage(message);
    if (error) {
      console.log(chalk.red("Validation error:"), error.details[0].message);
      return;
    }

    // Store the message in MongoDB
    const newMessage = new Message({
      userId,
      message,
    });

    newMessage
      .save()
      .then(() => {
        // Broadcast the message to all connected clients
        io.emit("chat message", { userId, message });
      })
      .catch((error) => {
        console.error(chalk.red("Error saving message to MongoDB:"), error);
      });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(chalk.red("A user disconnected"));

    // Remove the user from the connected users object
    delete users[userId];

    // Notify all connected users about the user's disconnection
    io.emit("user disconnected", userId);
  });
});

// REST API endpoints

// Get all chat messages
app.get("/messages", (req, res) => {
  Message.find()
    .sort({ _id: -1 })
    .lean()
    .then((messages) => {
      res.json(messages);
    })
    .catch((error) => {
      console.error(
        chalk.red("Error retrieving messages from MongoDB:"),
        error
      );
      res.status(500).json({ success: false, error: "Server error" });
    });
});

// Send a chat message via REST API
app.post("/messages", (req, res) => {
  const { userId, message } = req.body;

  const newMessage = new Message({
    userId,
    message,
  });

  newMessage
    .save()
    .then(() => {
      // Broadcast the message to all connected clients
      io.emit("chat message", {
        userId,
        message,
      });
      res.status(200).json({ success: true });
    })
    .catch((error) => {
      console.error(chalk.red("Error saving message to MongoDB:"), error);
      res.status(500).json({ success: false, error: "Server error" });
    });
});

// Start the server
const port = process.env.PORT;
server.listen(port, () => {
  console.log(chalk.blue(`Server running on http://localhost:${port}`));
});
