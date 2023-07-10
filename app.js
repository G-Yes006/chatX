import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import chalk from "chalk";
import dotenv from "dotenv";
import User from "./models/user.js";
import { validateMessage } from "./hooks/validators.js";
import connectDB from "./config/db.js";
import Message from "./models/chat.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

app.use(bodyParser.json());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Serve static files from the public directory
app.use(express.static("public"));

// Store connected users
connectDB();

// Handle socket connections
io.on("connection", (socket) => {
  console.log(chalk.green("A user connected"));

  // Generate a unique user ID
  const userId = uuidv4();

  // Store the user ID in the socket object
  socket.userId = userId;

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

// Helper function to check authentication status
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: "Not authenticated" });
};

// REST API endpoints

// Get all chat messages
app.get("/messages", ensureAuthenticated, (req, res) => {
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
app.post("/messages", ensureAuthenticated, (req, res) => {
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

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
          return done(null, false, { message: "Incorrect email" });
        }

        // Compare the provided password with the stored password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Register a new user
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    // Create a new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res
      .status(200)
      .json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error(chalk.red("Error registering user:"), error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Log in a user
app.post("/login", passport.authenticate("local"), (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "User logged in successfully" });
});

// Log out a user
app.get("/logout", (req, res) => {
  req.logout();
  res
    .status(200)
    .json({ success: true, message: "User logged out successfully" });
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(chalk.blue(`Server running on http://localhost:${port}`));
});
