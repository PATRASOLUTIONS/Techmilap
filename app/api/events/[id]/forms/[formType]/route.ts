import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import Event from "@/models/Event"

// Get form questions for a specific form type
export async function GET(request: Request, { params }: { params: { id: string; formType: string } }) {
  console.log(`Form request received for event: ${params.id}, form type: ${params.formType}`)

  try {
    const eventId = params.id
    const formType = params.formType // attendee, volunteer, or speaker

    // Validate form type
    if (!["attendee", "volunteer", "speaker", "register"].includes(formType)) {
      console.log(`Invalid form type: ${formType}`)
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

    // Map "register" to "attendee" for backward compatibility
    const normalizedFormType = formType === "register" ? "attendee" : formType
    console.log(`Normalized form type: ${normalizedFormType}`)

    // Connect to database
    try {
      console.log("Connecting to database...")
      await connectToDatabase()
      console.log("Database connection successful")
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
    console.log(`Is valid ObjectId: ${isValidObjectId}`)

    // Get the event
    let event
    try {
      if (isValidObjectId) {
        console.log(`Looking up event by ID: ${eventId}`)
        event = await Event.findById(eventId).lean()
      }

      // If not found by ID or not a valid ObjectId, try to find by slug
      if (!event) {
        console.log(`Event not found by ID, trying slug: ${eventId}`)
        event = await Event.findOne({ slug: eventId }).lean()
      }

      if (!event) {
        console.log(`Event not found for ID/slug: ${eventId}`)
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

      console.log(`Found event: ${event.title || event._id}`)
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
      console.log(`Extracting ${normalizedFormType} form data`)

      // Safely access nested properties
      const getNestedProperty = (obj, path) => {
        return path.split(".").reduce((prev, curr) => {
          return prev && prev[curr] ? prev[curr] : null
        }, obj)
      }

      if (normalizedFormType === "attendee") {
        // For backward compatibility, check both attendeeForm and forms.attendee
        formStatus =
          getNestedProperty(event, "attendeeForm.status") ||
          getNestedProperty(event, "forms.attendee.status") ||
          "published"

        questions =
          getNestedProperty(event, "customQuestions.attendee") ||
          getNestedProperty(event, "forms.attendee.questions") ||
          []
      } else if (normalizedFormType === "volunteer") {
        formStatus =
          getNestedProperty(event, "volunteerForm.status") ||
          getNestedProperty(event, "forms.volunteer.status") ||
          "published"

        questions =
          getNestedProperty(event, "customQuestions.volunteer") ||
          getNestedProperty(event, "forms.volunteer.questions") ||
          []
      } else if (normalizedFormType === "speaker") {
        formStatus =
          getNestedProperty(event, "speakerForm.status") ||
          getNestedProperty(event, "forms.speaker.status") ||
          "published"

        questions =
          getNestedProperty(event, "customQuestions.speaker") ||
          getNestedProperty(event, "forms.speaker.questions") ||
          []
      }

      console.log(`Form status: ${formStatus}`)
      console.log(`Found ${Array.isArray(questions) ? questions.length : 0} questions`)

      // Ensure questions is always an array
      if (!Array.isArray(questions)) {
        console.warn(`Questions for ${normalizedFormType} form is not an array:`, questions)
        questions = []
      }
    } catch (formError) {
      console.error(`Error extracting ${normalizedFormType} form data:`, formError)
      // Don't fail the request, just use empty questions
      questions = []
    }

    // Check if event has already started or passed
    const now = new Date()
    let eventDate
    let isEventPassed = false

    try {
      if (event.date) {
        console.log(`Event date: ${event.date}`)
        eventDate = new Date(event.date)

        // If event has a start time, use it for comparison
        if (event.startTime) {
          console.log(`Event start time: ${event.startTime}`)
          const [hours, minutes] = event.startTime.split(":").map(Number)
          eventDate.setHours(hours, minutes, 0, 0)
        }

        isEventPassed = now >= eventDate
        console.log(`Is event passed: ${isEventPassed}`)
      } else {
        console.log("No event date found")
      }
    } catch (dateError) {
      console.error("Error parsing event date:", dateError)
      eventDate = now // Default to current date if parsing fails
    }

    // If event has passed, override form status to closed
    if (isEventPassed) {
      formStatus = "closed"
      console.log("Form status set to closed because event has passed")
    }

    // Prepare the response data
    const responseData = {
      questions: questions,
      status: formStatus,
      eventTitle: event.title || event.displayName || "Event",
      eventSlug: event.slug || eventId,
      eventDate: event.date,
      startTime: event.startTime,
      isEventPassed: isEventPassed,
    }

    console.log("Sending successful response")

    // Return the questions, status, and event details
    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error(`Error in form API route:`, error)
    return new NextResponse(
      JSON.stringify({
        error: "Failed to fetch form. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
