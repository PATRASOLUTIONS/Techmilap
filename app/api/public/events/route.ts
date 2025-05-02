import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export const dynamic = "force-dynamic" // Ensure the route is not statically optimized

/**
 * Public API endpoint to fetch all events
 * This endpoint is accessible to anyone without authentication
 */
export async function GET(request: Request) {
  try {
    console.log("Public API: Connecting to database...")
    await connectToDatabase()
    console.log("Public API: Connected to database successfully")

    // Import models here to ensure they're only loaded after DB connection
    const Event = (await import("@/models/Event")).default
    const User = (await import("@/models/User")).default

    // Parse query parameters
    const url = new URL(request.url)
    const search = url.searchParams.get("search")
    const category = url.searchParams.get("category")
    const limit = Number.parseInt(url.searchParams.get("limit") || "12", 10)
    const page = Number.parseInt(url.searchParams.get("page") || "1", 10)
    const skip = (page - 1) * limit

    // Build query
    const query: any = { isActive: true }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ]
    }

    if (category && category !== "all") {
      query.category = category
    }

    console.log("Public API: Fetching events with query:", JSON.stringify(query))

    // Count total events for pagination
    const totalEvents = await Event.countDocuments(query)

    // Fetch events
    const events = await Event.find(query)
      .sort({ date: 1 }) // Sort by date ascending
      .skip(skip)
      .limit(limit)
      .lean()
      .exec()

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
      organizers = await User.find({ _id: { $in: organizerIds } }, { name: 1, email: 1, profileImage: 1 })
        .lean()
        .exec()
      console.log(`Public API: Found ${organizers.length} organizers`)
    }

    // Create organizer map for quick lookup
    const organizerMap: Record<string, any> = {}
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

    // Get distinct categories
    const categories = await Event.distinct("category")
    const validCategories = categories.filter(Boolean) // Filter out null/undefined values

    // Calculate pagination info
    const totalPages = Math.ceil(totalEvents / limit)

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        events: processedEvents,
        categories: validCategories,
        pagination: {
          total: totalEvents,
          page,
          limit,
          pages: totalPages,
        },
      },
      {
        headers: {
          // Set cache headers - cache for 5 minutes
          "Cache-Control": "public, max-age=300, s-maxage=300",
          // Set content type explicitly
          "Content-Type": "application/json",
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
          // Set content type explicitly
          "Content-Type": "application/json",
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
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  )
}
