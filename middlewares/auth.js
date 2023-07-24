import jwt from "jsonwebtoken";
import chalk from "chalk";
import User from "../models/user.js";

export const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    console.log(chalk.red("No token provided"));
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log(chalk.red("Invalid token"));
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    try {
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Attach user details to req.user
      req.user = {
        userId: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        status: user.status,
        bio: user.bio,
      };

      next();
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  });
};
