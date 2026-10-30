import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/terminal_velocity";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connects to MongoDB Atlas with connection caching for serverless environments.
 * Prevents multiple socket pools on Vercel lambda invocations.
 */
export async function connectToDatabase(): Promise<typeof mongoose | null> {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/terminal_velocity";

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.warn("MongoDB connection warning:", err.message);
        return null as unknown as typeof mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    return null;
  }
}
