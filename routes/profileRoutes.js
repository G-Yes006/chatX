import express from "express";
import User from "../models/user.js";
import { authenticateToken } from "../middlewares/auth.js";
import { upload, handleMulterError } from "../middlewares/multerValidation.js";
import chalk from "chalk";

const router = express.Router();

// Get user profile
router.get("/getProfileDetails", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error(chalk.red("Error retrieving user profile:"), error);
    res.status(500).json({ success: false, error: "Server error" });
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
      const profilePicture = req.file ? req.file.filename : undefined;

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { status, bio, profilePicture },
        { new: true }
      );

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error(chalk.red("Error updating user profile:"), error.message);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

export default router;
