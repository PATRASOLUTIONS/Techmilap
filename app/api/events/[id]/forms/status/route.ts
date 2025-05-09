import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"

// Add cache control headers to prevent excessive API calls
export async function GET(request, { params }) {
  try {
    const { id } = params

    // Connect to the database
    await connectToDatabase({
      cache: "no-store",
    })

    // Find the event
    const event = await Event.findById(id)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Return the form status and event slug with cache headers
    const response = NextResponse.json({
      eventSlug: event.slug,
      attendeeForm: event.forms?.attendee || { status: "draft" },
      volunteerForm: event.forms?.volunteer || { status: "draft" },
      speakerForm: event.forms?.speaker || { status: "draft" },
    })

    // Add cache control headers to prevent frequent refetching
    response.headers.set("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=300")

    return response
  } catch (error) {
    console.error("Error fetching form status:", error)
    return NextResponse.json({ error: "Failed to fetch form status" }, { status: 500 })
  }
}
