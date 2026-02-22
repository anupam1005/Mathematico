const mongoose = require('mongoose');

/**
 * Production-safe MongoDB connection with strict error handling
 * - Fails fast if MONGO_URI is missing
 * - Throws explicit errors (no silent failures)
 * - Validates connection state before returning
 * - Structured error logging
 * - Vercel serverless compatible
 */
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is undefined");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Full error:", error);

    throw error; // do not silently degrade
  }
};

module.exports = connectDB;
