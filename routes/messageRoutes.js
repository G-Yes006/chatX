import express from "express";
import { authenticateToken } from "../middlewares/auth.js";
import Message from "../models/chat.js";
import { messageSchema } from "../validations/messageValidation.js";
import chalk from "chalk";

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

    // Validate the request body
    const { error } = messageSchema.validate({ userId, message });
    if (error) {
      console.log(chalk.red("Validation error:"), error.details[0].message);
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });
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
    console.error(chalk.red("Error sending message:"), error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Update a chat message
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { userId, message } = req.body;
    const messageId = req.params.id;

    // Validate the request body
    const { error } = messageSchema.validate({ userId, message });
    if (error) {
      console.log(chalk.red("Validation error:"), error.details[0].message);
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });
    }

    // Check if the message exists
    const existingMessage = await Message.findById(messageId);

    if (!existingMessage) {
      console.log(chalk.red("Message not found"));
      return res
        .status(404)
        .json({ success: false, error: "Message not found" });
    }

    // Check if the user is the owner of the message
    if (existingMessage.userId !== userId) {
      console.log(chalk.red("You are not authorized to update this message"));
      return res.status(403).json({
        success: false,
        error: "You are not authorized to update this message",
      });
    }

    // Update the message
    existingMessage.message = message;

    await existingMessage.save();

    console.log(chalk.green("Message updated successfully"));

    res.json({ success: true, message: "Message updated successfully" });
  } catch (error) {
    console.error(chalk.red("Error updating message:"), error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Delete a chat message
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const messageId = req.params.id;

    // Validate the request body
    const { error } = messageSchema.validate({ userId });
    if (error) {
      console.log(chalk.red("Validation error:"), error.details[0].message);
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });
    }

    // Check if the message exists
    const existingMessage = await Message.findById(messageId);

    if (!existingMessage) {
      console.log(chalk.red("Message not found"));
      return res
        .status(404)
        .json({ success: false, error: "Message not found" });
    }

    // Check if the user is the owner of the message
    if (existingMessage.userId !== userId) {
      console.log(chalk.red("You are not authorized to delete this message"));
      return res.status(403).json({
        success: false,
        error: "You are not authorized to delete this message",
      });
    }

    // Delete the message
    await existingMessage.remove();

    console.log(chalk.green("Message deleted successfully"));

    res.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error(chalk.red("Error deleting message:"), error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
