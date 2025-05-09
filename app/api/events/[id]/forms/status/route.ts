import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"

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

    // Create the response
    const response = NextResponse.json({
      eventSlug: event.slug,
      attendeeForm: event.forms?.attendee || { status: "draft" },
      volunteerForm: event.forms?.volunteer || { status: "draft" },
      speakerForm: event.forms?.speaker || { status: "draft" },
    })

    // Add strong cache headers to prevent frequent refetching
    response.headers.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600")
    response.headers.set("Surrogate-Control", "max-age=300")
    response.headers.set("CDN-Cache-Control", "max-age=300")
    response.headers.set("Vercel-CDN-Cache-Control", "max-age=300")

    return response
  } catch (error) {
    console.error("Error fetching form status:", error)
    return NextResponse.json({ error: "Failed to fetch form status" }, { status: 500 })
  }
}
