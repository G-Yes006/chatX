import xss from "xss";
import mongoSanitize from "express-mongo-sanitize";
import chalk from "chalk";

// Middleware to sanitize user input to prevent NoSQL injection and XSS attacks
export const dataSanitizationMiddleware = (req, res, next) => {
  // Sanitize request parameters
  for (const key in req.params) {
    req.params[key] = xss(req.params[key]);
  }

  // Sanitize request query parameters
  for (const key in req.query) {
    req.query[key] = xss(req.query[key]);
  }

  // Sanitize request body
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        req.body[key] = xss(req.body[key]);
      }
    }
  }

  // Remove any keys containing prohibited characters from request body
  req.body = mongoSanitize.sanitize(req.body);

  // Log sanitized data for debugging (optional)
  console.log(chalk.yellow("Sanitized Request Params:"), req.params);
  console.log(chalk.yellow("Sanitized Request Query:"), req.query);
  console.log(chalk.yellow("Sanitized Request Body:"), req.body);

  next();
};
