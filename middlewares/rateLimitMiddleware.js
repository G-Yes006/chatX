import rateLimit from "express-rate-limit";
import chalk from "chalk";

// Rate limiting configuration (limit to 100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  handler: (req, res) => {
    console.error(
      chalk.red("Rate Limit Exceeded:"),
      `IP ${req.ip} has exceeded the rate limit.`
    );

    res.status(429).json({
      success: false,
      message: "Rate limit exceeded. Please try again later.",
    });
  },
});

export default limiter;
