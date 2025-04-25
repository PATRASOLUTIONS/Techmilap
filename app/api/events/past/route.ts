import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    // Get current date
    const currentDate = new Date()

    // Get pagination parameters from query
    const searchParams = req.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10)
    const skip = (page - 1) * limit

    // Find events with dates before the current date
    const pastEvents = await Event.find({
      endDate: { $lt: currentDate },
    })
      .sort({ date: -1 }) // Sort by date descending (most recent first)
      .skip(skip)
      .limit(limit)
      .populate("organizer", "firstName lastName")
      .lean()

    // Get total count for pagination
    const total = await Event.countDocuments({
      endDate: { $lt: currentDate },
    })

    return NextResponse.json({
      events: pastEvents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Error fetching past events:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching past events" },
      { status: 500 },
    )
  }
}
