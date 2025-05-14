import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { connectToDatabase, isConnected } from "@/lib/mongodb"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  }

  try {
    // Check MongoDB connection status
    const connectionStatus = {
      readyState: mongoose.connection.readyState,
      status: isConnected() ? "connected" : "disconnected",
    }

    // Test database connection
    const connectionTest = { success: false, error: null }
    try {
      await connectToDatabase()
      connectionTest.success = true
    } catch (error) {
      connectionTest.error = error instanceof Error ? error.message : "Unknown error"
    }

    // Get environment info (without exposing sensitive data)
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      mongoUriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
      mongoUriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 10) + "..." : null,
    }

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        eventId: params.id,
        mongoConnection: connectionStatus,
        connectionTest,
        environment: envInfo,
        serverTime: new Date().toString(),
      },
      { status: 200, headers },
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: "Debug endpoint error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500, headers },
    )
  }
}
