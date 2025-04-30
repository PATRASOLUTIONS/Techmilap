import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import User from "@/models/User"

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const debug = searchParams.get("debug") === "true"

    // Get pagination parameters
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // Build query
    const query: any = {}

    // Only show published and active events by default
    if (!debug) {
      query.status = { $in: ["published", "active"] }
    }

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

    console.log("Public events query:", JSON.stringify(query))

    // First, get total count for pagination
    const total = await Event.countDocuments(query)

    // Get events with pagination
    const events = await Event.find(query)
      .sort({ date: 1 }) // Sort by date ascending (upcoming first)
      .skip(skip)
      .limit(limit)
      .lean()

    // Get the current date for comparison
    const now = new Date()

    // Categorize events
    const upcomingEvents = []
    const runningEvents = []
    const pastEvents = []

    // Get organizer info for each event
    const organizerIds = events.map((event) => event.organizer).filter(Boolean)
    const organizers =
      organizerIds.length > 0 ? await User.find({ _id: { $in: organizerIds } }, { name: 1, email: 1 }).lean() : []

    // Create a map of organizer info for quick lookup
    const organizerMap = {}
    organizers.forEach((org) => {
      organizerMap[org._id.toString()] = {
        name: org.name,
        email: org.email,
      }
    })

    for (const event of events) {
      try {
        // Add organizer info to event
        if (event.organizer) {
          const organizerId = event.organizer.toString()
          event.organizerInfo = organizerMap[organizerId] || { name: "Event Organizer" }
        }

        // Handle missing or invalid dates
        if (!event.date) {
          upcomingEvents.push(event)
          continue
        }

        const eventDate = new Date(event.date)
        if (isNaN(eventDate.getTime())) {
          upcomingEvents.push(event)
          continue
        }

        // Determine end date - use endDate if available, otherwise use date + 1 day
        let eventEndDate
        if (event.endDate) {
          eventEndDate = new Date(event.endDate)
          if (isNaN(eventEndDate.getTime())) {
            eventEndDate = new Date(eventDate)
            eventEndDate.setDate(eventEndDate.getDate() + 1)
          }
        } else {
          // No end date specified, assume event ends at the end of the day
          eventEndDate = new Date(eventDate)
          eventEndDate.setHours(23, 59, 59, 999)
        }

        // Categorize based on date
        if (eventDate > now) {
          upcomingEvents.push(event)
        } else if (eventEndDate < now) {
          pastEvents.push(event)
        } else {
          runningEvents.push(event)
        }
      } catch (error) {
        console.error(`Error processing event ${event._id}:`, error)
        upcomingEvents.push(event)
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
      success: true,
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
        success: false,
        error: error.message || "An error occurred while fetching events",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
