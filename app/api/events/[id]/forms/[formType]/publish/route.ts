import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"

export async function POST(request, { params }) {
  try {
    const { id, formType } = params
    const { status, questions } = await request.json()

    // Connect to the database
    await connectToDatabase()

    // Find the event
    const event = await Event.findById(id)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Initialize forms object if it doesn't exist
    if (!event.forms) {
      event.forms = {}
    }

    // Update the form status and questions
    event.forms[formType] = {
      status,
      questions,
      updatedAt: new Date(),
    }

    // Save the event
    await event.save()

    // Return success response with event slug
    return NextResponse.json({
      success: true,
      message: `Form ${status === "published" ? "published" : "updated"} successfully`,
      eventSlug: event.slug,
    })
  } catch (error) {
    console.error(`Error ${status === "published" ? "publishing" : "updating"} form:`, error)
    return NextResponse.json(
      { error: `Failed to ${status === "published" ? "publish" : "update"} form` },
      { status: 500 },
    )
  }
}
