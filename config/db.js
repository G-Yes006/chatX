import mongoose from "mongoose";
import chalk from "chalk";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(chalk.magenta("Connected to MongoDB"));
  } catch (error) {
    console.error(chalk.red("MongoDB connection error:"), error);
    process.exit(1);
  }
};

export default connectDB;
