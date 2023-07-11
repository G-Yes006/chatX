import jwt from "jsonwebtoken";
import chalk from "chalk";

export const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    console.log(chalk.red("No token provided"));
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log(chalk.red("Invalid token"));
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    req.userId = decoded.userId;
    next();
  });
};
