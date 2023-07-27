import chalk from "chalk";

const apiLogger = (req, res, next) => {
  const { method, originalUrl, body, query } = req;
  console.log(chalk.yellow("API Request:"));
  console.log(chalk.cyan("Method:"), method);
  console.log(chalk.cyan("URL:"), originalUrl);
  console.log(chalk.cyan("Query Parameters:"), query);
  console.log(chalk.cyan("Request Body:"), body);

  res.on("finish", () => {
    const { statusCode, statusMessage } = res;
    console.log(chalk.yellow("API Response:"));
    console.log(chalk.cyan("Status:"), `${statusCode} ${statusMessage}`);
  });

  next();
};

export default apiLogger;
