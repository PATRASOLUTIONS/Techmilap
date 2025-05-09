import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import Event from "@/models/Event"

// Get form questions for a specific form type
export async function GET(request: Request, { params }: { params: { id: string; formType: string } }) {
  try {
    const eventId = params.id
    const formType = params.formType // attendee, volunteer, or speaker

    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    // Connect to database
    await connectToDatabase()

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(eventId)

    // Get the event
    let event
    if (isValidObjectId) {
      event = await Event.findById(eventId).lean()
    }

    // If not found by ID or not a valid ObjectId, try to find by slug
    if (!event) {
      event = await Event.findOne({ slug: eventId }).lean()
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Get the form status based on form type
    let formStatus = "published" // Default to published for public access
    let questions = []

    if (formType === "attendee") {
      // For backward compatibility, check both attendeeForm and forms.attendee
      formStatus = event.attendeeForm?.status || event.forms?.attendee?.status || "published"
      questions = event.customQuestions?.attendee || event.forms?.attendee?.questions || []
    } else if (formType === "volunteer") {
      formStatus = event.volunteerForm?.status || event.forms?.volunteer?.status || "published"
      questions = event.customQuestions?.volunteer || event.forms?.volunteer?.questions || []
    } else if (formType === "speaker") {
      formStatus = event.speakerForm?.status || event.forms?.speaker?.status || "published"
      questions = event.customQuestions?.speaker || event.forms?.speaker?.questions || []
    }

    console.log(`Form status for ${formType}: ${formStatus}`)
    console.log(`Questions for ${formType}:`, questions)

    // Return the questions and status
    return NextResponse.json({
      questions: questions,
      status: formStatus,
      eventTitle: event.title || event.displayName || "Event",
      eventSlug: event.slug || eventId,
    })
  } catch (error) {
    console.error(`Error fetching ${params.formType} form:`, error)
    return NextResponse.json({ error: "Failed to fetch form. Please try again." }, { status: 500 })
  }
}
