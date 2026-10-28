import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cached: MongooseCache = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalForMongoose.mongooseCache = cached;

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(mongoUri, {
        bufferCommands: false,
      })
      .then((m) => m)
      .catch((err) => {
        cached.promise = null;
        console.error("MongoDB connection error:", err);
        return null as unknown as typeof mongoose;
      });
  }

  try {
    const conn = await cached.promise;
    if (conn) {
      cached.conn = conn;
    }
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error("Failed to establish MongoDB connection:", error);
    return null;
  }
}
