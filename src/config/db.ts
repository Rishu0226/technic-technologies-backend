import mongoose from "mongoose";

let connection: Promise<typeof mongoose> | null = null;

export function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose);
  }

  if (!connection) {
    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) {
      return Promise.reject(new Error("MONGODB_URI is not set"));
    }

    const local = /^mongodb(\+srv)?:\/\/(?:[^@/]+@)?(localhost|127\.0\.0\.1)(?::|\/|$)/i.test(uri);
    if (local && process.env.VERCEL) {
      return Promise.reject(
        new Error("MONGODB_URI points at localhost, which Vercel cannot reach. Use the MongoDB Atlas connection string."),
      );
    }

    connection = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 8000,
        family: 4,
      })
      .catch((error: unknown) => {
        connection = null;
        throw error;
      });
  }

  return connection;
}
