import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export const dynamic = "force-dynamic" // Ensure the route is not statically optimized

/**
 * Public API endpoint to fetch all events
 * This endpoint is accessible to anyone without authentication
 */
export async function GET() {
  try {
    console.log("Public API: Connecting to database...")
    await connectToDatabase()
    console.log("Public API: Connected to database successfully")

    // Import models here to ensure they're only loaded after DB connection
    const Event = (await import("@/models/Event")).default
    const User = (await import("@/models/User")).default

    console.log("Public API: Fetching events...")
    const events = await Event.find({ isActive: true }).lean()
    console.log(`Public API: Found ${events.length} events`)

    // Get unique organizer IDs
    const organizerIds = events
      .map((event) => event.organizer)
      .filter(Boolean)
      .map((id) => id.toString())

    // Fetch organizers
    let organizers = []
    if (organizerIds.length > 0) {
      console.log("Public API: Fetching organizer information...")
      organizers = await User.find({ _id: { $in: organizerIds } }, { name: 1, email: 1 }).lean()
      console.log(`Public API: Found ${organizers.length} organizers`)
    }

    // Create organizer map for quick lookup
    const organizerMap = {}
    for (const organizer of organizers) {
      organizerMap[organizer._id.toString()] = organizer
    }

    // Add organizer info to events
    const processedEvents = events.map((event) => {
      const eventWithOrganizer = { ...event }

      if (event.organizer) {
        const organizerId = event.organizer.toString()
        eventWithOrganizer.organizerInfo = organizerMap[organizerId] || null
      }

      return eventWithOrganizer
    })

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        events: processedEvents,
      },
      {
        headers: {
          // Set cache headers - cache for 5 minutes
          "Cache-Control": "public, max-age=300, s-maxage=300",
          // Allow CORS
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    )
  } catch (error) {
    console.error("Public API: Error fetching events:", error)

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred while fetching events",
      },
      {
        status: 500,
        headers: {
          // Don't cache errors
          "Cache-Control": "no-cache, no-store, must-revalidate",
          // Allow CORS
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    )
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  )
}
