import mongoose from "mongoose";
import chalk from "chalk";

const connectDB = async () => {
  try {
    // Connect to MongoDB using the provided URL
    await mongoose.connect(process.env.MONGO_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Once connected, log the successful connection in green
    console.log(chalk.green("Connected to MongoDB"));
  } catch (error) {
    // If any error occurs during the connection process, catch it here
    // Log the error message in red
    console.error(chalk.red("MongoDB connection error:"), error);

    // Terminate the Node.js process with a non-zero exit code (1)
    process.exit(1);
  }
};

// Set Mongoose to use debug mode for logging database operations
// This will output helpful debug information in the console during development
mongoose.set("debug", true);

export default connectDB;
