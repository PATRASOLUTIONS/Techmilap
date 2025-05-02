import mongoose from "mongoose"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local")
}

// Connection options with improved settings
const options = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 50, // Add connection pool size limit
  minPoolSize: 10, // Maintain minimum connections for better performance
  maxIdleTimeMS: 60000, // Close idle connections after 1 minute
}

// Global connection objects
let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null
let isConnected = false
let connectionPromise: Promise<typeof mongoose> | null = null

// Create a cached connection promise for MongoDB client
if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve connection across hot-reloads
  const globalWithMongoClientPromise = global as typeof globalThis & {
    _mongoClientPromise: Promise<MongoClient>
    _mongooseConnected: boolean
    _connectionPromise: Promise<typeof mongoose> | null
  }

  if (!globalWithMongoClientPromise._mongoClientPromise) {
    client = new MongoClient(uri, options as any)
    globalWithMongoClientPromise._mongoClientPromise = client.connect()
    globalWithMongoClientPromise._connectionPromise = null
  }
  clientPromise = globalWithMongoClientPromise._mongoClientPromise
  connectionPromise = globalWithMongoClientPromise._connectionPromise
} else {
  // In production mode, create a new connection for each instance
  client = new MongoClient(uri, options as any)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise
export default clientPromise

// Mongoose connection with improved error handling and reconnection logic
export async function connectToDatabase() {
  if (isConnected) {
    return mongoose.connection
  }

  // If a connection attempt is already in progress, return that promise
  if (connectionPromise) {
    await connectionPromise
    return mongoose.connection
  }

  // Create a new connection promise
  connectionPromise = (async () => {
    try {
      if (mongoose.connection.readyState !== 1) {
        // Set up event listeners for connection issues
        mongoose.connection.on("error", (err) => {
          console.error("MongoDB connection error:", err)
          isConnected = false
        })

        mongoose.connection.on("disconnected", () => {
          console.warn("MongoDB disconnected. Attempting to reconnect...")
          isConnected = false
        })

        mongoose.connection.on("connected", () => {
          console.log("MongoDB connected successfully")
          isConnected = true
        })

        // Connect with improved options
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 30000,
          maxPoolSize: 50,
          minPoolSize: 10,
        } as any)
      }

      isConnected = true
      console.log("Successfully connected to MongoDB")
      return mongoose
    } catch (e) {
      console.error("Failed to connect to MongoDB", e)
      isConnected = false
      connectionPromise = null
      throw e
    }
  })()

  await connectionPromise
  return mongoose.connection
}

// Helper function to get the database
export async function getDatabase() {
  await connectToDatabase()
  return mongoose.connection.db
}

// Helper to check connection status
export function isConnectedToDatabase() {
  return isConnected
}

// Graceful shutdown handler
export async function disconnectFromDatabase() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
      console.log("Mongoose disconnected")
    }

    if (client) {
      await client.close()
      console.log("MongoDB client closed")
    }

    isConnected = false
    connectionPromise = null
    return true
  } catch (error) {
    console.error("Error during database disconnection:", error)
    return false
  }
}
