import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to the database
    await connectToDatabase()

    // Import models here to ensure they're only loaded after DB connection
    const Event = (await import("@/models/Event")).default
    const User = (await import("@/models/User")).default

    // Count total events
    const totalEvents = await Event.countDocuments()

    // Get a sample of events (limit to 5)
    const sampleEvents = await Event.find().sort({ createdAt: -1 }).limit(5).lean().exec()

    // Get database stats
    const connection = await connectToDatabase()
    const dbStats = await connection.db.stats()

    return NextResponse.json({
      success: true,
      totalEvents,
      sampleEvents,
      dbStats: {
        collections: dbStats.collections,
        objects: dbStats.objects,
        avgObjSize: dbStats.avgObjSize,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
      },
      mongooseConnectionState: connection.readyState,
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch debug information",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}
