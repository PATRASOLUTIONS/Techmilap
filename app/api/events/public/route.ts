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

    // Get pagination parameters
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // Build query
    const query: any = {}

    // Only show published and active events by default
    // In debug mode, show all events including drafts
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
    console.log(`Pagination: page ${page}, limit ${limit}, skip ${skip}`)

    // First, get total count for pagination
    const total = await Event.countDocuments(query)
    console.log(`Total events matching query: ${total}`)

    // Get all events without pagination first to properly categorize them
    // This is important to ensure we're showing the correct counts for each category
    const allEvents = await Event.find(query).lean()
    console.log(`Found ${allEvents.length} total events before categorization`)

    // Get the current date for comparison
    const now = new Date()

    // Categorize events
    const upcomingEvents = []
    const runningEvents = []
    const pastEvents = []

    for (const event of allEvents) {
      try {
        // Handle missing or invalid dates
        if (!event.date) {
          console.log(`Event ${event._id} has no date, considering it as upcoming`)
          upcomingEvents.push(event)
          continue
        }

        const eventDate = new Date(event.date)

        // Skip events with invalid dates
        if (isNaN(eventDate.getTime())) {
          console.log(`Event ${event._id} has invalid date: ${event.date}`)
          upcomingEvents.push(event) // Default to upcoming for invalid dates
          continue
        }

        // Determine end date - use endDate if available, otherwise use date + 1 day
        let eventEndDate
        if (event.endDate) {
          eventEndDate = new Date(event.endDate)
          if (isNaN(eventEndDate.getTime())) {
            // If endDate is invalid, use date + 1 day
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
        // Default to upcoming if there's an error
        upcomingEvents.push(event)
      }
    }

    console.log(
      `Categorized events: ${upcomingEvents.length} upcoming, ${runningEvents.length} running, ${pastEvents.length} past`,
    )

    // Apply pagination to each category
    // For simplicity, we'll just return all events in each category for now
    // In a real app, you might want to paginate each category separately

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

    // Log some sample events for debugging
    if (upcomingEvents.length > 0) {
      console.log("Sample upcoming event:", {
        id: upcomingEvents[0]._id,
        title: upcomingEvents[0].title,
        date: upcomingEvents[0].date,
        status: upcomingEvents[0].status,
      })
    }

    return NextResponse.json({
      events: allEvents.map(formatEvent),
      upcomingEvents: upcomingEvents.map(formatEvent),
      runningEvents: runningEvents.map(formatEvent),
      pastEvents: pastEvents.map(formatEvent),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      debug: debug
        ? {
            query,
            totalEvents: allEvents.length,
            upcomingCount: upcomingEvents.length,
            runningCount: runningEvents.length,
            pastCount: pastEvents.length,
          }
        : undefined,
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
