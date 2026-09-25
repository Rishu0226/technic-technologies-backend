import mongoose from "mongoose";

let connection: Promise<typeof mongoose> | null = null;

export function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose);
  }

  if (!connection) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return Promise.reject(new Error("MONGODB_URI is not set"));
    }

    connection = mongoose.connect(uri).catch((error) => {
      connection = null;
      throw error;
    });
  }

  return connection;
}
