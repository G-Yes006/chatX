import chalk from "chalk";

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch((error) => {
    console.error(chalk.red("Async Handler Error:"), error.message);
    const statusCode = error.statusCode || 500;
    const errorMessage = statusCode === 500 ? "Server error" : error.message;
    res.status(statusCode).json({ success: false, error: errorMessage });
  });
};

export { asyncHandler };
