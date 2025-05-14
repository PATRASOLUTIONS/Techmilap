import { NextResponse } from "next/server"
import clientPromise, { checkConnection } from "@/lib/mongodb"

export async function GET() {
  try {
    // Check MongoDB connection
    const connectionStatus = await checkConnection()

    if (!connectionStatus.connected) {
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to connect to MongoDB",
          error: connectionStatus.error,
        },
        { status: 500 },
      )
    }

    // Try to perform a simple operation
    const client = await clientPromise
    const db = client.db()
    const collections = await db.listCollections().toArray()

    return NextResponse.json({
      status: "success",
      message: "MongoDB connection successful",
      collections: collections.map((col) => col.name),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("MongoDB debug endpoint error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error connecting to MongoDB",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
