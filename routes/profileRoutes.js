import express from "express";
import User from "../models/user.js";
import { authenticateToken } from "../middlewares/auth.js";
import { upload, handleMulterError } from "../middlewares/multerValidation.js";
import chalk from "chalk";
import AppError from "./../hooks/customErrors.js"; // Import the AppError class
import { updateProfileSchema } from "./../validations/profileValidation.js";
import { asyncHandler } from "../middlewares/asyncHandler.js"; // Custom asyncHandler middleware
import { ErrorResponse, SuccessResponse } from "../helpers/response.js"; // Import the response constructors

const router = express.Router();

// Get user profile
router.get(
  "/getProfileDetails",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      throw new ErrorResponse("User not found", 404);
    }

    const successResponse = new SuccessResponse({ user });
    successResponse.log();

    res.json(successResponse);
  })
);

// Update user profile
router.patch(
  "/updateProfileDetails",
  authenticateToken,
  upload.single("profilePicture"),
  handleMulterError,
  asyncHandler(async (req, res) => {
    const { status, bio } = req.body;

    // Validate user input using Joi schema
    const { error } = updateProfileSchema.validate({ status, bio });
    if (error) {
      throw new ErrorResponse(error.details[0].message, 400);
    }

    const profilePicture = req.file ? req.file.filename : undefined;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { status, bio, profilePicture },
      { new: true }
    );

    if (!user) {
      throw new ErrorResponse("User not found", 404);
    }

    const successResponse = new SuccessResponse({ user });
    successResponse.log();

    res.json(successResponse);
  })
);

export default router;
