import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Update the GET function to include the event slug in the response
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id

    // Connect to database
    const client = await connectToDatabase()
    const db = client.db()

    // Get the event
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Return the form status and event slug
    return NextResponse.json({
      attendeeForm: event.attendeeForm || { status: "draft" },
      volunteerForm: event.volunteerForm || { status: "draft" },
      speakerForm: event.speakerForm || { status: "draft" },
      eventSlug: event.slug || eventId, // Include the event slug
    })
  } catch (error) {
    console.error("Error fetching form status:", error)
    return NextResponse.json({ error: "Failed to fetch form status. Please try again." }, { status: 500 })
  }
}
