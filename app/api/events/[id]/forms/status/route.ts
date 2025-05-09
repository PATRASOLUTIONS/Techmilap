import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"

export async function GET(request, { params }) {
  try {
    const { id } = params

    // Check for force refresh in the request
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get("forceRefresh") === "true"

    // Connect to the database
    await connectToDatabase({
      cache: forceRefresh ? "no-store" : "force-cache",
    })

    // Find the event
    const event = await Event.findById(id)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Create the response with the correct form status
    const response = NextResponse.json({
      eventSlug: event.slug,
      attendeeForm: event.attendeeForm || { status: "draft" },
      volunteerForm: event.volunteerForm || { status: "draft" },
      speakerForm: event.speakerForm || { status: "draft" },
    })

    // Add cache headers based on whether we're forcing a refresh
    if (forceRefresh) {
      response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
      response.headers.set("Pragma", "no-cache")
      response.headers.set("Expires", "0")
    } else {
      // Use a short cache time to allow for updates but still provide some caching benefit
      response.headers.set("Cache-Control", "public, max-age=10, s-maxage=30")
    }

    return response
  } catch (error) {
    console.error("Error fetching form status:", error)
    return NextResponse.json({ error: "Failed to fetch form status" }, { status: 500 })
  }
}
