import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import User from "@/models/User"

export async function GET() {
  try {
    // Connect to the database
    await connectToDatabase()

    console.log("Fetching all events...")

    // Fetch all active events
    const events = await Event.find({ isActive: true })
      .sort({ date: 1 }) // Sort by date ascending
      .lean()

    console.log(`Found ${events.length} events`)

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
    })
  } catch (error: any) {
    console.error("Error fetching all events:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while fetching events",
      },
      { status: 500 },
    )
  }
}
