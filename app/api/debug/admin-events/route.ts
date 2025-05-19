import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ error: "Not authenticated", session: null }, { status: 401 })
    }

    // Connect to database
    const db = await connectToDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Import models
    const Event = (await import("@/models/Event")).default
    const User = (await import("@/models/User")).default

    // Get basic counts
    const eventCount = await Event.countDocuments()
    const userCount = await User.countDocuments()

    // Get a sample event with organizer
    const sampleEvent = await Event.findOne().populate("organizer", "name email").lean()

    return NextResponse.json({
      debug: true,
      auth: {
        isAuthenticated: !!session,
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
        },
      },
      counts: {
        events: eventCount,
        users: userCount,
      },
      sampleEvent: sampleEvent || null,
      message: "This is a debug endpoint for the admin events API",
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json(
      {
        error: "Debug endpoint error",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
