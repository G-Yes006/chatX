import chalk from "chalk";
import User from "../models/user.js";

const updateUserOnlineStatus = async (userId, onlineStatus) => {
  try {
    // Find the user by userId
    const user = await User.findById(userId);

    if (!user) {
      console.error(chalk.red("User not found"));
      return;
    }

    // Update the online status of the user
    user.isOnline = onlineStatus;
    await user.save();

    console.log(
      chalk.green(
        `User ${user.name} (${user.email}) online status updated to ${onlineStatus}`
      )
    );
  } catch (error) {
    console.error(
      chalk.red("Error updating user online status:"),
      error.message
    );
  }
};

export default updateUserOnlineStatus;
