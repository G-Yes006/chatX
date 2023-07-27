import winston from "winston";
import fs from "fs";
import path from "path";
import chalk from "chalk";

// Get the directory name of the current module
const logsDirectory = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "./../logs"
);

// Create logs directory if it does not exist
if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory);
}

// Create a custom Winston logger with log format and transport to file
const logger = winston.createLogger({
  level: "error",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level}]: ${message} \n${stack || ""}`;
    })
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDirectory, "error.log"),
      level: "error",
    }),
  ],
});

// Export the logger
export default logger;
