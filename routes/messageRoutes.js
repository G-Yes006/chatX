import express from "express";
import { authenticateToken } from "../middlewares/auth.js";
import Message from "../models/chat.js";
import chalk from "chalk";
import { messageSchema } from "../validations/messageValidation.js";
import { asyncHandler } from "../middlewares/asyncHandler.js"; // Custom asyncHandler middleware
import { ErrorResponse, SuccessResponse } from "../helpers/response.js"; // Import the response constructors

const router = express.Router();

// Get all chat messages
router.get(
  "/getAllMessages",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const messages = await Message.find().sort({ _id: -1 }).lean();
    res.json(messages);
  })
);

// Send a chat message
router.post(
  "/sendMessage",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { userId, message } = req.body;

    // Validate the request body using Joi schema
    const { error } = messageSchema.validate({ userId, message });
    if (error) {
      throw new ErrorResponse(error.details[0].message, 400);
    }

    // Create a new message
    const newMessage = new Message({ userId, message });
    await newMessage.save();

    console.log(chalk.green("Message sent:", message));

    const successResponse = new SuccessResponse({
      message: "Message sent successfully",
      data: { message },
    });
    successResponse.log();

    res.status(201).json(successResponse);
  })
);

// Update a chat message
router.put(
  "/:id",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { userId, message } = req.body;
    const messageId = req.params.id;

    // Validate the request body using Joi schema
    const { error } = messageSchema.validate({ userId, message });
    if (error) {
      throw new ErrorResponse(error.details[0].message, 400);
    }

    // Check if the message exists
    const existingMessage = await Message.findById(messageId);
    if (!existingMessage) {
      throw new ErrorResponse("Message not found", 404);
    }

    // Check if the user is the owner of the message
    if (existingMessage.userId !== userId) {
      throw new ErrorResponse(
        "You are not authorized to update this message",
        403
      );
    }

    // Update the message
    existingMessage.message = message;
    await existingMessage.save();

    console.log(chalk.green("Message updated successfully"));

    const successResponse = new SuccessResponse({
      message: "Message updated successfully",
    });
    successResponse.log();

    res.json(successResponse);
  })
);

// Delete a chat message
router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const messageId = req.params.id;

    // Validate the request body using Joi schema
    const { error } = messageSchema.validate({ userId });
    if (error) {
      throw new ErrorResponse(error.details[0].message, 400);
    }

    // Check if the message exists
    const existingMessage = await Message.findById(messageId);
    if (!existingMessage) {
      throw new ErrorResponse("Message not found", 404);
    }

    // Check if the user is the owner of the message
    if (existingMessage.userId !== userId) {
      throw new ErrorResponse(
        "You are not authorized to delete this message",
        403
      );
    }

    // Delete the message
    await existingMessage.remove();

    console.log(chalk.green("Message deleted successfully"));

    const successResponse = new SuccessResponse({
      message: "Message deleted successfully",
    });
    successResponse.log();

    res.json(successResponse);
  })
);

export default router;
