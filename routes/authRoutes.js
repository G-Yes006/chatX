import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import chalk from "chalk";
import AppError from "../hooks/customErrors.js"; // Import the AppError class
import { authenticateToken } from "../middlewares/auth.js";
import User from "../models/user.js";
import { registerSchema, loginSchema } from "../validations/authValidation.js";
import { dataSanitizationMiddleware } from "./../middlewares/dataSanitizationMiddleware.js";
import updateUserOnlineStatus from "./../helpers/updateUserOnlineStatus.js"; // Import the updateUserOnlineStatus function
import { asyncHandler } from "../middlewares/asyncHandler.js"; // Custom asyncHandler middleware
import { ErrorResponse, SuccessResponse } from "../helpers/response.js"; // Import the response constructors

const router = express.Router();

// Register a new user
router.post(
  "/register",
  dataSanitizationMiddleware,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Validate the request body using Joi schema
    const { error } = registerSchema.validate({ name, email, password });
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }

    // Create a new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });

    await newUser.save();

    console.log(chalk.green("User registered successfully"));

    const successResponse = new SuccessResponse({
      message: "User registered successfully",
    });
    successResponse.log();

    res.status(201).json(successResponse);
  })
);

// Log in a user
router.post(
  "/login",
  dataSanitizationMiddleware,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate the request body using Joi schema
    const { error } = loginSchema.validate({ email, password });
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    // Compare the provided password with the stored password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new AppError("Invalid credentials", 401);
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log(chalk.green("User logged in successfully"));

    // User logs in, update online status to true
    updateUserOnlineStatus(user._id, true);

    const successResponse = new SuccessResponse({ token });
    successResponse.log();

    res.status(200).json(successResponse);
  })
);

// Log out a user
router.get(
  "/logout",
  authenticateToken,
  dataSanitizationMiddleware,
  asyncHandler(async (req, res) => {
    // Get the user ID from the authenticated token
    const userId = req.user.userId;

    console.log(chalk.green("User logged out successfully"));

    // Update user's online status to false when they log out
    updateUserOnlineStatus(userId, false);

    const successResponse = new SuccessResponse({
      message: "User logged out successfully",
    });
    successResponse.log();

    res.status(200).json(successResponse);
  })
);

export default router;
