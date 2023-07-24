import chalk from "chalk";

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 100; // Maximum 5 requests per minute
const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes block duration

const ipRequestCounts = {}; // Object to store request counts and timestamps for each IP address

// Rate Limiting middleware with IP validation
const limiter = (req, res, next) => {
  const ip = req.ip; // Get the client's IP address from the request object

  // Check if the IP address is blocked
  if (ipRequestCounts[ip]?.isBlocked) {
    const timeRemaining = ipRequestCounts[ip]?.blockTimestamp - Date.now();
    if (timeRemaining > 0) {
      console.log(
        chalk.yellow(`IP Address ${ip} is blocked for ${timeRemaining}ms`)
      );
      return res.status(429).json({
        success: false,
        error: `Too many requests. Please try again after ${
          timeRemaining / 1000
        } seconds`,
      });
    } else {
      // Unblock the IP address after the block duration has passed
      delete ipRequestCounts[ip];
    }
  }

  // Initialize the IP address request count and timestamp if not already present
  if (!ipRequestCounts[ip]) {
    ipRequestCounts[ip] = {
      count: 0,
      timestamp: Date.now(),
    };
  }

  // Check if the window has passed, and reset the request count if necessary
  if (Date.now() - ipRequestCounts[ip].timestamp > RATE_LIMIT_WINDOW) {
    ipRequestCounts[ip].count = 0;
    ipRequestCounts[ip].timestamp = Date.now();
  }

  // Increment the request count for the IP address
  ipRequestCounts[ip].count++;

  // Check if the IP address has exceeded the maximum requests per window
  if (ipRequestCounts[ip].count > MAX_REQUESTS_PER_WINDOW) {
    // Block the IP address and set the block timestamp
    ipRequestCounts[ip].isBlocked = true;
    ipRequestCounts[ip].blockTimestamp = Date.now() + BLOCK_DURATION;

    console.log(
      chalk.red(`IP Address ${ip} is blocked for ${BLOCK_DURATION}ms`)
    );

    return res.status(429).json({
      success: false,
      error: `Too many requests. Please try again after ${
        BLOCK_DURATION / 1000
      } seconds`,
    });
  }

  next();
};

export default limiter;
