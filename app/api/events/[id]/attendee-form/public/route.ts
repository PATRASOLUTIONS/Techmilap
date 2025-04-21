import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id

    const client = await connectToDatabase()
    const db = client.db()

    // Get the event
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the attendee form is published
    if (!event.attendeeForm || event.attendeeForm.status !== "published") {
      return NextResponse.json({ error: "Registration is not open for this event" }, { status: 403 })
    }

    // Get the custom questions for attendees
    const fields = event.customQuestions?.attendee || []

    // Return the form data
    return NextResponse.json({
      form: {
        title: "Event Registration Form",
        description: "Please fill out this form to register for the event.",
        fields: fields,
        status: event.attendeeForm.status,
      },
    })
  } catch (error) {
    console.error("Error fetching attendee form:", error)
    return NextResponse.json({ error: "Failed to fetch form. Please try again." }, { status: 500 })
  }
}
