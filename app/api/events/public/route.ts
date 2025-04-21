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

    // Build query - start with minimal filtering to diagnose the issue
    const query: any = {}

    // Only apply status filter if not in debug mode
    if (!debug) {
      query.status = { $in: ["published", "active", "draft"] } // Include draft for testing
    }

    // Add search filter if provided
    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Add category filter if provided and not "all"
    if (category && category !== "all") {
      query.category = category
    }

    console.log("Public events query:", JSON.stringify(query))

    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // Get total count of all events for debugging
    const totalEvents = await Event.countDocuments({})
    console.log(`Total events in database: ${totalEvents}`)

    // Get total count for pagination with our filters
    const total = await Event.countDocuments(query)
    console.log(`Events matching query: ${total}`)

    const events = await Event.find(query)
      .sort({ createdAt: -1 }) // Most recent first for testing
      .skip(skip)
      .limit(limit)
      .lean()

    console.log(`Found ${events.length} public events`)

    // Log a sample event for debugging
    if (events.length > 0) {
      console.log("Sample event:", {
        id: events[0]._id,
        title: events[0].title,
        status: events[0].status,
        date: events[0].date,
      })
    }

    // Format events for response
    const formattedEvents = events.map((event) => ({
      ...event,
      id: event._id.toString(),
      _id: event._id.toString(), // Ensure _id is a string
      slug: event.slug || event._id.toString(),
      attendeeCount: event.attendees?.length || 0,
      hasAttendeeForm: event.attendeeForm?.status === "published",
      hasVolunteerForm: event.volunteerForm?.status === "published",
      hasSpeakerForm: event.speakerForm?.status === "published",
    }))

    return NextResponse.json({
      events: formattedEvents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        totalEvents, // Include total events count for debugging
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
