import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Get current date
    const currentDate = new Date()

    // Get pagination parameters from query
    const searchParams = req.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10)
    const skip = (page - 1) * limit

    // Find events with dates before the current date
    // Use a more flexible query that handles events with or without endDate
    const query = {
      $or: [
        // Events with endDate in the past
        { endDate: { $lt: currentDate } },
        // Events with date in the past and no endDate
        { date: { $lt: currentDate }, endDate: { $exists: false } },
      ],
      // Include events where the user is an attendee, organizer, volunteer, or speaker
      $or: [
        { organizer: session.user.id },
        { attendees: session.user.id },
        { volunteers: session.user.id },
        { speakers: session.user.id },
      ],
    }

    const pastEvents = await Event.find(query)
      .sort({ date: -1 }) // Sort by date descending (most recent first)
      .skip(skip)
      .limit(limit)
      .populate("organizer", "firstName lastName email")
      .lean()

    // Get total count for pagination
    const total = await Event.countDocuments(query)

    // Transform the events to include user role
    const eventsWithUserRole = pastEvents.map((event) => {
      let userRole = "attendee"

      if (
        event.organizer &&
        (event.organizer._id?.toString() === session.user.id || event.organizer.email === session.user.email)
      ) {
        userRole = "organizer"
      } else if (event.volunteers?.includes(session.user.id)) {
        userRole = "volunteer"
      } else if (event.speakers?.includes(session.user.id)) {
        userRole = "speaker"
      }

      return {
        ...event,
        userRole,
      }
    })

    return NextResponse.json({
      events: eventsWithUserRole,
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
      {
        error: error.message || "An error occurred while fetching past events",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
