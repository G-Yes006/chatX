import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import chalk from "chalk";
import { authenticateToken } from "../middlewares/auth.js";
import User from "../models/user.js";
import { registerSchema, loginSchema } from "../validations/authValidation.js";

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate the request body
    const { error } = registerSchema.validate({ name, email, password });
    if (error) {
      console.log(chalk.red("Validation error:"), error.details[0].message);
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log(chalk.red("Email already registered"));
      return res
        .status(409)
        .json({ success: false, error: "Email already registered" });
    }

    // Create a new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });

    await newUser.save();

    console.log(chalk.green("User registered successfully"));

    res
      .status(201)
      .json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error(chalk.red("Error registering user:"), error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Log in a user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate the request body
    const { error } = loginSchema.validate({ email, password });
    if (error) {
      console.log(chalk.red("Validation error:"), error.details[0].message);
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log(chalk.red("Invalid credentials"));
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    // Compare the provided password with the stored password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log(chalk.red("Invalid credentials"));
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log(chalk.green("User logged in successfully"));

    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error(chalk.red("Error logging in user:"), error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Log out a user
router.get("/logout", authenticateToken, (req, res) => {
  try {
    // Perform any additional logout actions if needed

    console.log(chalk.green("User logged out successfully"));

    res
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    console.error(chalk.red("Error logging out user:"), error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
