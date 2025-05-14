import { MongoClient } from "mongodb"
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

// MongoDB Client setup for direct MongoDB operations
let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof global & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(MONGODB_URI)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

// Helper function to get the database - REQUIRED BY OTHER MODULES
export async function getDatabase() {
  const connectedClient = await clientPromise
  return connectedClient.db()
}

// Mongoose setup for Mongoose models
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
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
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

// Helper function to check if MongoDB is connected
export function isConnected() {
  return mongoose.connection.readyState === 1
}

// Helper function to safely disconnect
export async function disconnectFromDatabase() {
  try {
    await mongoose.disconnect()
    cached.conn = null
    cached.promise = null
    console.log("Disconnected from MongoDB")
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error)
  }
}
