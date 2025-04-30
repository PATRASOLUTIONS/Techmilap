import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const debug = searchParams.get("debug") === "true"

    // Build query
    const query: any = {}

    // Only show published and active events
    query.status = { $in: ["published", "active"] }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ]
    }

    // Add category filter if provided and not "all"
    if (category && category !== "all") {
      query.category = category
    }

    const now = new Date()

    // Get pagination parameters
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    console.log("Public events query:", JSON.stringify(query))

    // Get events
    const events = await Event.find(query)
      .sort({ date: 1 }) // Sort by date ascending (upcoming first)
      .skip(skip)
      .limit(limit)
      .lean()

    console.log(`Found ${events.length} public events`)

    // Get total count for pagination
    const total = await Event.countDocuments(query)

    // Separate events into categories
    const upcomingEvents = []
    const runningEvents = []
    const pastEvents = []

    for (const event of events) {
      const eventDate = new Date(event.date)
      const eventEndDate = event.endDate ? new Date(event.endDate) : new Date(eventDate)

      // Add one day to end date if no specific end date was provided
      if (!event.endDate) {
        eventEndDate.setDate(eventEndDate.getDate() + 1)
      }

      if (eventDate > now) {
        upcomingEvents.push(event)
      } else if (eventEndDate < now) {
        pastEvents.push(event)
      } else {
        runningEvents.push(event)
      }
    }

    // Format events for response
    const formatEvent = (event: any) => ({
      ...event,
      id: event._id.toString(),
      _id: event._id.toString(),
      slug: event.slug || event._id.toString(),
      attendeeCount: event.attendees?.length || 0,
      hasAttendeeForm: event.attendeeForm?.status === "published",
      hasVolunteerForm: event.volunteerForm?.status === "published",
      hasSpeakerForm: event.speakerForm?.status === "published",
      organizer: event.organizer ? event.organizer.toString() : null,
    })

    return NextResponse.json({
      events: events.map(formatEvent),
      upcomingEvents: upcomingEvents.map(formatEvent),
      runningEvents: runningEvents.map(formatEvent),
      pastEvents: pastEvents.map(formatEvent),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Error fetching public events:", error)
    return NextResponse.json(
      {
        error: error.message || "An error occurred while fetching events",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
