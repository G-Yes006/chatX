import express from "express";
import { authenticateToken } from "../middlewares/auth.js";
import Message from "../models/chat.js";

const router = express.Router();

// Get all chat messages
router.get("/", authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find().sort({ _id: -1 }).lean();
    res.json(messages);
  } catch (error) {
    console.error("Error retrieving messages from MongoDB:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Send a chat message
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid request body" });
    }

    // Create a new message
    const newMessage = new Message({ userId, message });

    await newMessage.save();

    res
      .status(201)
      .json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Update a chat message
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { userId, message } = req.body;
    const messageId = req.params.id;

    if (!userId || !message || !messageId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid request body or parameters" });
    }

    // Check if the message exists
    const existingMessage = await Message.findById(messageId);

    if (!existingMessage) {
      return res
        .status(404)
        .json({ success: false, error: "Message not found" });
    }

    // Check if the user is the owner of the message
    if (existingMessage.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to update this message",
      });
    }

    // Update the message
    existingMessage.message = message;

    await existingMessage.save();

    res.json({ success: true, message: "Message updated successfully" });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Delete a chat message
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const messageId = req.params.id;

    if (!userId || !messageId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid request body or parameters" });
    }

    // Check if the message exists
    const existingMessage = await Message.findById(messageId);

    if (!existingMessage) {
      return res
        .status(404)
        .json({ success: false, error: "Message not found" });
    }

    // Check if the user is the owner of the message
    if (existingMessage.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to delete this message",
      });
    }

    // Delete the message
    await existingMessage.remove();

    res.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
