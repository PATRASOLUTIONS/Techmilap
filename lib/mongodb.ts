import { MongoClient } from "mongodb"
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local")
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

const options = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(MONGODB_URI, options)
  clientPromise = client.connect()
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    console.error("MongoDB connection error:", e)
    throw e
  }

  return cached.conn
}

// Add schema definitions for Event and User models
export function defineModels() {
  // Only define models if they don't already exist
  if (!mongoose.models.Event) {
    const eventSchema = new mongoose.Schema(
      {
        title: String,
        description: String,
        date: Date,
        endDate: Date,
        startTime: String,
        endTime: String,
        location: String,
        image: String,
        coverImageUrl: String,
        category: String,
        price: Number,
        tags: [String],
        slug: String,
        organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
      { strict: false },
    )

    mongoose.model("Event", eventSchema)
  }

  if (!mongoose.models.User) {
    const userSchema = new mongoose.Schema(
      {
        firstName: String,
        lastName: String,
        email: String,
        name: String,
      },
      { strict: false },
    )

    mongoose.model("User", userSchema)
  }
}

const getDatabase = async () => {
  await connectToDatabase()
  return mongoose.connection.db
}

const isConnected = () => {
  return mongoose.connection.readyState === 1
}

export { getDatabase, isConnected, client }
export default clientPromise
