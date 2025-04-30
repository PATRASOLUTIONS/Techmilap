import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import mongoose from "mongoose"

export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(searchParams.get("limit") || "12", 10)
    const skip = (page - 1) * limit

    // Build the query
    const query: any = {
      status: { $in: ["published", "active"] }, // Only show published or active events
    }

    // Add category filter if provided
    if (category && category !== "all") {
      query.category = category
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ]
    }

    // Get the current date
    const now = new Date()

    // Count total documents for pagination
    const totalEvents = await Event.countDocuments(query)

    // Fetch events
    const events = await Event.find(query)
      .sort({ date: 1 }) // Sort by date ascending
      .skip(skip)
      .limit(limit)
      .lean()

    console.log(`Found ${events.length} events matching the query`)

    // Get unique organizer IDs
    const organizerIds = [...new Set(events.map((event) => event.organizer).filter(Boolean))]

    // Fetch organizers in a single query
    const organizers = organizerIds.length
      ? await mongoose
          .model("User")
          .find({ _id: { $in: organizerIds } }, { name: 1, email: 1 })
          .lean()
      : []

    // Create a map for quick lookup
    const organizerMap = organizers.reduce(
      (map, user) => {
        map[user._id.toString()] = user
        return map
      },
      {} as Record<string, any>,
    )

    // Categorize events
    const upcomingEvents = []
    const runningEvents = []
    const pastEvents = []

    for (const event of events) {
      // Add organizer info
      if (event.organizer) {
        const organizerId = event.organizer.toString()
        event.organizerInfo = organizerMap[organizerId] || null
      }

      // Format the event for response
      const formattedEvent = {
        ...event,
        id: event._id.toString(),
        _id: event._id.toString(),
        slug: event.slug || event._id.toString(),
        attendeeCount: event.attendees?.length || 0,
        hasAttendeeForm: event.attendeeForm?.status === "published",
        hasVolunteerForm: event.volunteerForm?.status === "published",
        hasSpeakerForm: event.speakerForm?.status === "published",
        organizer: event.organizer ? event.organizer.toString() : null,
      }

      try {
        const eventDate = event.date ? new Date(event.date) : null
        const eventEndDate = event.endDate ? new Date(event.endDate) : null

        // If no dates are provided, consider it an upcoming event
        if (!eventDate) {
          upcomingEvents.push(formattedEvent)
          continue
        }

        // Check if the event is running (started but not ended)
        if (eventDate <= now && (!eventEndDate || eventEndDate >= now)) {
          runningEvents.push(formattedEvent)
          continue
        }

        // Check if the event is past (ended)
        if ((eventEndDate && eventEndDate < now) || (eventDate < now && !eventEndDate)) {
          pastEvents.push(formattedEvent)
          continue
        }

        // Otherwise, it's an upcoming event
        upcomingEvents.push(formattedEvent)
      } catch (error) {
        console.error(`Error processing event ${event._id}:`, error)
        // If there's an error processing dates, consider it an upcoming event
        upcomingEvents.push(formattedEvent)
      }
    }

    console.log(
      `Categorized: ${upcomingEvents.length} upcoming, ${runningEvents.length} running, ${pastEvents.length} past`,
    )

    // Return the response
    return NextResponse.json({
      success: true,
      events: events.map((e) => ({
        ...e,
        id: e._id.toString(),
        _id: e._id.toString(),
        slug: e.slug || e._id.toString(),
      })),
      upcomingEvents,
      runningEvents,
      pastEvents,
      pagination: {
        total: totalEvents,
        page,
        limit,
        pages: Math.ceil(totalEvents / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching public events:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch events",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}
