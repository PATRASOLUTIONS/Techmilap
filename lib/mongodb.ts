import mongoose from "mongoose"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local")
}

// Connection options with increased timeout
const options = {
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongoClientPromise = global as typeof globalThis & {
    _mongoClientPromise: Promise<MongoClient>
    _mongooseConnected: boolean
  }

  if (!globalWithMongoClientPromise._mongoClientPromise) {
    client = new MongoClient(uri, options as any)
    globalWithMongoClientPromise._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongoClientPromise._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options as any)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

// Mongoose connection
let isConnected = false

export async function connectToDatabase() {
  console.log("Attempting to connect to MongoDB...") // Add this line
  if (isConnected) {
    console.log("Using existing MongoDB connection")
    return mongoose.connection
  }

  try {
    // For Mongoose
    if (mongoose.connection.readyState !== 1) {
      console.log("Creating new MongoDB connection...") // Add this line
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
      } as any)
    }

    isConnected = true
    console.log("Successfully connected to MongoDB")
    return mongoose.connection
  } catch (e) {
    console.error("Failed to connect to MongoDB", e)
    isConnected = false
    throw e
  }
}

// Helper function to get the database
export async function getDatabase() {
  await connectToDatabase()
  return mongoose.connection.db
}
