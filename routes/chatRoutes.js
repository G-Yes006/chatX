import express from "express";
import { authenticateToken } from "../middlewares/auth.js";
import Message from "../models/chat.js";
import chalk from "chalk";
import { messageSchema } from "../validations/messageValidation.js";
import { asyncHandler } from "../middlewares/asyncHandler.js"; // Custom asyncHandler middleware
import { ErrorResponse, SuccessResponse } from "../helpers/response.js"; // Import the response constructors

const router = express.Router();

// Get all chat messages with pagination
router.get(
  "/getAllMessages",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { page = 1, pageSize = 10 } = req.query;
    const { userId } = req.user;

    // Parse page and pageSize query parameters to integers
    const pageNum = parseInt(page, 10);
    const limit = parseInt(pageSize, 10);

    // Calculate skip value to retrieve the correct batch of messages
    const skip = (pageNum - 1) * limit;

    try {
      // Query the messages from MongoDB for the specified user and retrieve total count
      const [messages, totalMessages] = await Promise.all([
        Message.find({ userId })
          .sort({ _id: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Message.countDocuments({ userId }),
      ]);

      // Calculate the total number of pages based on pageSize
      const totalPages = Math.ceil(totalMessages / limit);

      console.log(
        chalk.green(`Fetched messages page ${pageNum} of ${totalPages}`)
      );

      // Create a SuccessResponse with the retrieved messages and pagination information
      const successResponse = new SuccessResponse({
        messages,
        totalMessages,
        totalPages,
        currentPage: pageNum,
      });

      // Send the successResponse as JSON
      res.json(successResponse);
    } catch (error) {
      // If any error occurs during the database query or processing, create an ErrorResponse
      const errorResponse = new ErrorResponse(
        "Error fetching chat messages",
        500
      );
      res.status(500).json(errorResponse);
    }
  })
);

// Send a chat message
router.post(
  "/sendMessage",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { message } = req.body;
    const { userId } = req.user;

    // Validate the request body using Joi schema
    const { error } = messageSchema.validate({ message });
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
// Update a chat message
router.put(
  "/:id/editMessage",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { message } = req.body;
    const { userId } = req.user;
    const messageId = req.params.id;

    console.log("====>", userId, messageId);

    // Validate the request body using Joi schema
    const { error } = messageSchema.validate({ message });
    if (error) {
      throw new ErrorResponse(error.details[0].message, 400);
    }

    try {
      // Check if the message exists
      const existingMessage = await Message.findById(messageId);
      if (!existingMessage) {
        throw new ErrorResponse("Message not found", 404);
      }

      // Check if the user is the owner of the message
      if (existingMessage.userId !== userId.toString()) {
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
    } catch (error) {
      // If any error occurs during the database query or processing, create an ErrorResponse
      const errorResponse = new ErrorResponse(
        error.message,
        error.statusCode || 500
      );
      res.status(error.statusCode || 500).json(errorResponse);
    }
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
