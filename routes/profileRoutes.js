import express from "express";
import User from "../models/user.js";
import { authenticateToken } from "../middlewares/auth.js";
import { upload, handleMulterError } from "../middlewares/multerValidation.js";
import chalk from "chalk";
import AppError from "./../hooks/customErrors.js"; // Import the AppError class
import { updateProfileSchema } from "./../validations/profileValidation.js";

const router = express.Router();

// Get user profile
router.get("/getProfileDetails", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error(chalk.red("Error retrieving user profile:"), error.message);
    res
      .status(error.statusCode || 500)
      .json({ success: false, error: error.message });
  }
});

// Update user profile
router.patch(
  "/updateProfileDetails",
  authenticateToken,
  upload.single("profilePicture"),
  handleMulterError,
  async (req, res) => {
    try {
      const { status, bio } = req.body;

      // Validate user input using Joi schema
      const { error } = updateProfileSchema.validate({ status, bio });
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const profilePicture = req.file ? req.file.filename : undefined;

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { status, bio, profilePicture },
        { new: true }
      );

      if (!user) {
        throw new AppError("User not found", 404);
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error(chalk.red("Error updating user profile:"), error.message);
      res
        .status(error.statusCode || 500)
        .json({ success: false, error: error.message });
    }
  }
);

export default router;
