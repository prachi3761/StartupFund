import mongoose from 'mongoose';
import { config } from './config.js';

/**
 * Connect to MongoDB using Mongoose.
 *
 * @param {string} [uri] - Optional override for the MongoDB connection string.
 *                         Defaults to the configured MONGO_URI.
 * @returns {Promise<typeof mongoose>} The active Mongoose instance.
 */
export async function connectDB(uri = config.mongoUri) {
  await mongoose.connect(uri);
  return mongoose;
}

/**
 * Disconnect from MongoDB.
 *
 * @returns {Promise<void>}
 */
export async function disconnectDB() {
  await mongoose.disconnect();
}

export { mongoose };
