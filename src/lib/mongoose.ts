import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Global is used to maintain a cached connection across hot reloads in development
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    console.warn("⚠️ MONGODB_URI is not defined. Falling back to local mock document store (In-Memory).");
    return null; // The services will check if this is null and use a fallback JSON/in-memory store.
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("Connected to MongoDB successfully");
      return mongoose;
    }).catch(err => {
      console.error("Failed to connect to MongoDB:", err);
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
