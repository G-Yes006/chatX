// utils.js
import chalk from "chalk";

// Helper function to generate a unique chat room name for private chat
export function generateChatRoomName(userId1, userId2) {
  const sortedIds = [userId1, userId2].sort();
  const chatRoomName = `${sortedIds[0]}-${sortedIds[1]}`;

  console.log(chalk.green(`Generated chat room name: ${chatRoomName}`));
  return chatRoomName;
}
