import express from "express";
import { authenticateToken } from "../middlewares/auth.js";
import Message from "../models/chat.js";
import chalk from "chalk";
import { messageSchema } from "../validations/messageValidation.js";
import AppError from "../hooks/customErrors.js"; // Import the AppError class

const router = express.Router();

// Get all chat messages
router.get("/getAllMessages", authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find().sort({ _id: -1 }).lean();
    res.json(messages);
  } catch (error) {
    console.error(chalk.red("Error retrieving messages from MongoDB:"), error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Send a chat message
router.post("/sendMessage", authenticateToken, async (req, res) => {
  try {
    const { userId, message } = req.body;

    // Validate the request body using Joi schema
    const { error } = messageSchema.validate({ userId, message });
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Create a new message
    const newMessage = new Message({ userId, message });

    await newMessage.save();

    console.log(chalk.green("Message sent:", message));

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: { message: message },
    });
  } catch (error) {
    console.error(chalk.red("Error sending message:"), error.message);
    res
      .status(error.statusCode || 500)
      .json({ success: false, error: error.message });
  }
});

// Update a chat message
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { userId, message } = req.body;
    const messageId = req.params.id;

    // Validate the request body using Joi schema
    const { error } = messageSchema.validate({ userId, message });
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Check if the message exists
    const existingMessage = await Message.findById(messageId);

    if (!existingMessage) {
      throw new AppError("Message not found", 404);
    }

    // Check if the user is the owner of the message
    if (existingMessage.userId !== userId) {
      throw new AppError("You are not authorized to update this message", 403);
    }

    // Update the message
    existingMessage.message = message;

    await existingMessage.save();

    console.log(chalk.green("Message updated successfully"));

    res.json({ success: true, message: "Message updated successfully" });
  } catch (error) {
    console.error(chalk.red("Error updating message:"), error.message);
    res
      .status(error.statusCode || 500)
      .json({ success: false, error: error.message });
  }
});

// Delete a chat message
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const messageId = req.params.id;

    // Validate the request body using Joi schema
    const { error } = messageSchema.validate({ userId });
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Check if the message exists
    const existingMessage = await Message.findById(messageId);

    if (!existingMessage) {
      throw new AppError("Message not found", 404);
    }

    // Check if the user is the owner of the message
    if (existingMessage.userId !== userId) {
      throw new AppError("You are not authorized to delete this message", 403);
    }

    // Delete the message
    await existingMessage.remove();

    console.log(chalk.green("Message deleted successfully"));

    res.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error(chalk.red("Error deleting message:"), error.message);
    res
      .status(error.statusCode || 500)
      .json({ success: false, error: error.message });
  }
});

export default router;
