import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"

export async function GET(request, { params }) {
  try {
    const { id } = params

    // Connect to the database
    await connectToDatabase()

    // Find the event
    const event = await Event.findById(id)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Return the form status and event slug
    return NextResponse.json({
      eventSlug: event.slug,
      attendeeForm: event.forms?.attendee || { status: "draft" },
      volunteerForm: event.forms?.volunteer || { status: "draft" },
      speakerForm: event.forms?.speaker || { status: "draft" },
    })
  } catch (error) {
    console.error("Error fetching form status:", error)
    return NextResponse.json({ error: "Failed to fetch form status" }, { status: 500 })
  }
}
