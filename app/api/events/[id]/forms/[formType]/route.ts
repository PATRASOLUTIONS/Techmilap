import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import Event from "@/models/Event"

// Get form questions for a specific form type
export async function GET(request: Request, { params }: { params: { id: string; formType: string } }) {
  try {
    const eventId = params.id
    const formType = params.formType // attendee, volunteer, or speaker

    // Validate form type
    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json(
        { error: "Invalid form type" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // Connect to database
    try {
      await connectToDatabase()
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json(
        { error: "Failed to connect to database. Please try again later." },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(eventId)

    // Get the event
    let event
    try {
      if (isValidObjectId) {
        event = await Event.findById(eventId).lean()
      }

      // If not found by ID or not a valid ObjectId, try to find by slug
      if (!event) {
        event = await Event.findOne({ slug: eventId }).lean()
      }

      if (!event) {
        return NextResponse.json(
          { error: "Event not found" },
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
            },
          },
        )
      }
    } catch (eventError) {
      console.error("Error fetching event:", eventError)
      return NextResponse.json(
        { error: "Failed to fetch event. Please try again later." },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // Get the form status based on form type
    let formStatus = "published" // Default to published for public access
    let questions = []

    try {
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

      // Ensure questions is always an array
      if (!Array.isArray(questions)) {
        console.warn(`Questions for ${formType} form is not an array:`, questions)
        questions = []
      }
    } catch (formError) {
      console.error(`Error extracting ${formType} form data:`, formError)
      // Don't fail the request, just use empty questions
      questions = []
    }

    // Check if event has already started or passed
    const now = new Date()
    let eventDate

    try {
      eventDate = new Date(event.date)

      // If event has a start time, use it for comparison
      if (event.startTime) {
        const [hours, minutes] = event.startTime.split(":").map(Number)
        eventDate.setHours(hours, minutes, 0, 0)
      }
    } catch (dateError) {
      console.error("Error parsing event date:", dateError)
      eventDate = now // Default to current date if parsing fails
    }

    const isEventPassed = now >= eventDate

    // If event has passed, override form status to closed
    if (isEventPassed) {
      formStatus = "closed"
    }

    // Return the questions, status, and event details
    return NextResponse.json(
      {
        questions: questions,
        status: formStatus,
        eventTitle: event.title || event.displayName || "Event",
        eventSlug: event.slug || eventId,
        eventDate: event.date,
        startTime: event.startTime,
        isEventPassed: isEventPassed,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error(`Error fetching ${params.formType} form:`, error)
    return NextResponse.json(
      { error: "Failed to fetch form. Please try again." },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
