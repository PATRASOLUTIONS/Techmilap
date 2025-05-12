import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    console.log("Connecting to MongoDB...")
    try {
      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        console.log("MongoDB connected successfully")
        return { db: mongoose.connection.db, mongoose }
      })
    } catch (error) {
      console.error("MongoDB connection error:", error)
      cached.promise = null
      throw error
    }
  }

  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch (error) {
    console.error("Error resolving MongoDB connection promise:", error)
    cached.promise = null
    throw error
  }
}

export async function getDatabase() {
  const connection = await connectToDatabase()
  return connection.db
}

const clientPromise = connectToDatabase()

export default clientPromise
