import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash the password before saving the user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate a JWT token for the user
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return token;
};

const User = mongoose.model("User", userSchema);

export default User;
