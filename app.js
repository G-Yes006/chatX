import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import session from "express-session";
import passport from "passport";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import chalk from "chalk";

import connectDB from "./config/db.js";
import { validateMessage } from "./hooks/validators.js";

import messagesRouter from "./routes/messageRoutes.js";
import userRouter from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import limiter from "./middlewares/rateLimitMiddleware.js";
import monitoringMiddleware from "./middlewares/monitoringMiddleware.js";
import { dataSanitizationMiddleware } from "./middlewares/dataSanitizationMiddleware.js";
import apiLoggerAndMonitoringMiddleware from "./middlewares/loggingMiddleware.js";
// import apiLogger from "./middlewares/apiLogger.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.PASS_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(limiter);
// Serve static files from the public directory
app.use(express.static("public"));
// Add the monitoring middleware
app.use(monitoringMiddleware);
// Add the dataSanitizationMiddleware as a global middleware
app.use(dataSanitizationMiddleware);
// Add the apiLoggerAndMonitoringMiddleware middleware
app.use(apiLoggerAndMonitoringMiddleware);

// Connect to MongoDB
connectDB();

// Middleware to authenticate socket connections
const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication token not provided"));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error("Invalid authentication token"));
    }

    socket.userId = decoded.userId;
    next();
  });
};

// Handle socket connections
io.use(authenticateSocket).on("connection", (socket) => {
  console.log(chalk.green("A user connected"));

  const userId = socket.userId;

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
    io.emit("user disconnected", userId);
  });
});

// REST API endpoints
app.use("/messages", messagesRouter);
app.use("/users", userRouter);
app.use("/profile", profileRoutes);

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(chalk.magenta(`Server running on http://localhost:${port}`));
});
