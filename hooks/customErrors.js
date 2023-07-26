import chalk from "chalk";

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Set the error name to the class name
    this.name = this.constructor.name;

    // Log the error message in red using chalk
    console.error(chalk.red(`[${this.name}] ${this.message}`));
  }
}

export default AppError;
