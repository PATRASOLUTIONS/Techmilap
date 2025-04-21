import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    const client = await clientPromise
    const db = client.db()

    // Get the event
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the event has a published speaker form
    if (event.speakerForm?.status !== "published") {
      return NextResponse.json({ error: "Speaker form is not available" }, { status: 404 })
    }

    // Get the speaker form for this event
    const speakerQuestions = event.customQuestions?.speaker || []

    // Return the form data
    return NextResponse.json({
      form: {
        title: "Speaker Application Form",
        description: "Please fill out this form to apply as a speaker for this event.",
        fields: speakerQuestions,
        status: event.speakerForm?.status || "draft",
      },
    })
  } catch (error) {
    console.error("Error fetching speaker form:", error)
    return NextResponse.json({ error: "Failed to fetch speaker form" }, { status: 500 })
  }
}
