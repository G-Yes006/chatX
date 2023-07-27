import chalk from "chalk";

class SuccessResponse {
  constructor(data) {
    this.success = true;
    this.data = data;
  }

  log() {
    console.log(chalk.green("Success Response:"), this.data);
  }
}

class ErrorResponse {
  constructor(message, statusCode = 500) {
    this.success = false;
    this.error = message;
    this.statusCode = statusCode;
  }

  log() {
    console.error(chalk.red("Error Response:"), this.error);
  }
}

export { SuccessResponse, ErrorResponse };
