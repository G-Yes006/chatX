import chalk from "chalk";

const apiLoggerAndMonitoringMiddleware = (req, res, next) => {
  // Log request information
  console.log(
    chalk.blue("Request:"),
    chalk.yellow(req.method),
    req.originalUrl
  );

  // Store the start time of the request processing
  const startTime = Date.now();

  // Log the response finish event to calculate request processing time
  res.on("finish", () => {
    const processingTime = Date.now() - startTime;

    // Log response information with status code and processing time
    console.log(
      chalk.blue("Response:"),
      chalk.yellow(res.statusCode),
      res.statusMessage,
      chalk.green(`${processingTime}ms`)
    );

    // Log response size (content length) if available
    const contentLength = res.getHeader("Content-Length");
    if (contentLength) {
      const contentSizeInKB = contentLength / 1024;
      const contentSizeText =
        contentSizeInKB >= 1
          ? `${contentSizeInKB} KB`
          : `${contentLength} bytes`;

      console.log(chalk.blue("Response Size:"), chalk.yellow(contentSizeText));
    }

    // Log any errors or warnings sent in the response
    if (res.locals.errors) {
      console.log(chalk.red("Errors:"), res.locals.errors);
    }
    if (res.locals.warnings) {
      console.log(chalk.yellow("Warnings:"), res.locals.warnings);
    }
  });

  // Log any errors that occur during request processing
  res.on("error", (err) => {
    console.error(chalk.red("Response Error:"), err);
  });

  next();
};

export default apiLoggerAndMonitoringMiddleware;
