import logger from "./../helpers/logger.js";
import chalk from "chalk";

const loggingMiddleware = (err, req, res, next) => {
  // Log the error to the custom logger
  logger.error(err.message, { stack: err.stack });

  // Log the error using chalk to add color to the console output
  console.error(chalk.red("Error:"), err.message);
  console.error(chalk.red("Stack Trace:"), err.stack);

  // Send response to the client
  res.status(500).json({ success: false, error: "Server error" });
};

export default loggingMiddleware;
