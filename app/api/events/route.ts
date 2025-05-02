import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import User from "@/models/User"

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    const url = new URL(req.url)
    const filterPast = url.searchParams.get("past") === "true"
    const search = url.searchParams.get("search") || ""
    const category = url.searchParams.get("category") || ""
    const page = Number.parseInt(url.searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(url.searchParams.get("limit") || "12", 10)
    const skip = (page - 1) * limit

    const currentDate = new Date()

    // Build the query
    const query: any = {}

    // If filtering for past events
    if (filterPast) {
      query.date = { $lt: currentDate }
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

    // Count total documents for pagination
    const totalEvents = await Event.countDocuments(query)

    // Fetch events with pagination
    const events = await Event.find(query)
      .sort({ date: filterPast ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get unique organizer IDs
    const organizerIds = [...new Set(events.map((event) => event.organizer).filter(Boolean))]

    // Fetch organizers in a single query
    const organizers = organizerIds.length
      ? await User.find({ _id: { $in: organizerIds } }, { name: 1, email: 1 }).lean()
      : []

    // Create a map for quick lookup
    const organizerMap = organizers.reduce(
      (map, user) => {
        map[user._id.toString()] = user
        return map
      },
      {} as Record<string, any>,
    )

    // Add organizer info to events
    const eventsWithOrganizerInfo = events.map((event) => {
      if (event.organizer) {
        const organizerId = event.organizer.toString()
        return {
          ...event,
          organizerInfo: organizerMap[organizerId] || null,
        }
      }
      return event
    })

    return NextResponse.json({
      success: true,
      events: eventsWithOrganizerInfo,
      pagination: {
        total: totalEvents,
        page,
        limit,
        pages: Math.ceil(totalEvents / limit),
      },
    })
  } catch (error: any) {
    console.error("Error fetching events:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while fetching events",
      },
      { status: 500 },
    )
  }
}
