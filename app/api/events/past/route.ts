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

    // Ensure database connection is established before querying
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
    }

    // No need to filter by user role - show all past events to logged-in users
    const pastEvents = await Event.find(query)
      .sort({ date: -1 }) // Sort by date descending (most recent first)
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count for pagination
    const total = await Event.countDocuments(query)

    // Transform the events to include user role
    const eventsWithUserRole = pastEvents.map((event) => {
      let userRole = "attendee"
      const userId = session.user.id

      // Check if the user is the organizer
      if (event.organizer && event.organizer.toString() === userId) {
        userRole = "organizer"
      }
      // Check if the user is a volunteer
      else if (event.volunteers && event.volunteers.some((id: any) => id.toString() === userId)) {
        userRole = "volunteer"
      }
      // Check if the user is a speaker
      else if (event.speakers && event.speakers.some((id: any) => id.toString() === userId)) {
        userRole = "speaker"
      }
      // Check if the user is an attendee
      else if (event.attendees && event.attendees.some((id: any) => id.toString() === userId)) {
        userRole = "attendee"
      } else {
        userRole = "viewer" // User has no specific role in this event
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
