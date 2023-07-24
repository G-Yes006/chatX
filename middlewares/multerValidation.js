import multer from "multer";
import chalk from "chalk";

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

// Create a multer instance with the storage configuration
export const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if the file is an image
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      // Reject the file if it's not an image
      const error = new Error("Only image files are allowed");
      console.error(chalk.red("Multer Error:"), error.message);
      cb(error);
    }
  },
});

// Multer error handling middleware
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer error (e.g., file size limit exceeded)
    console.error(chalk.red("Multer Error:"), err.message);
    res.status(400).json({ success: false, error: err.message });
  } else if (err) {
    // Other error (e.g., not an image file)
    console.error(chalk.red("Multer Error:"), err.message);
    res.status(400).json({ success: false, error: err.message });
  } else {
    // If no error occurred, continue to the next middleware/route handler
    next();
  }
};

// export default upload;
