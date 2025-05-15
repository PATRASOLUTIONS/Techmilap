import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { connectToDatabase, isConnected } from "@/lib/mongodb"
import Event from "@/models/Event"

// Get form questions for a specific form type
export async function GET(request: Request, { params }: { params: { id: string; formType: string } }) {
  console.log(`Form request received for event: ${params.id}, form type: ${params.formType}`)

  // Set headers for all responses to ensure proper content type
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  }

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
          headers,
        },
      )
    }

    // Map "register" to "attendee" for backward compatibility
    const normalizedFormType = formType === "register" ? "attendee" : formType
    console.log(`Normalized form type: ${normalizedFormType}`)

    // Connect to database with retry logic
    let connectionAttempts = 0
    const maxAttempts = 3

    while (connectionAttempts < maxAttempts) {
      try {
        connectionAttempts++
        console.log(`MongoDB connection attempt ${connectionAttempts}/${maxAttempts}...`)

        if (!isConnected()) {
          await connectToDatabase()
        }

        // If we reach here, connection was successful
        console.log("MongoDB connection established")
        break
      } catch (dbError) {
        console.error(`Database connection error (attempt ${connectionAttempts}/${maxAttempts}):`, dbError)

        if (connectionAttempts >= maxAttempts) {
          return NextResponse.json(
            {
              error: "Failed to connect to database. Please try again later.",
              details: dbError instanceof Error ? dbError.message : "Unknown database error",
            },
            {
              status: 503, // Service Unavailable
              headers,
            },
          )
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, connectionAttempts - 1), 5000)
        console.log(`Waiting ${delay}ms before retry...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // Get the event - simplified approach
    let event
    try {
      console.log(`Looking up event with ID/slug: ${eventId}`)

      // First try to find by ID if it's a valid ObjectId
      if (mongoose.isValidObjectId(eventId)) {
        event = await Event.findById(eventId).lean().exec()
      }

      // If not found by ID or not a valid ObjectId, try to find by slug
      if (!event) {
        event = await Event.findOne({ slug: eventId }).lean().exec()
      }

      if (!event) {
        console.log(`Event not found for ID/slug: ${eventId}`)
        return NextResponse.json(
          { error: "Event not found" },
          {
            status: 404,
            headers,
          },
        )
      }

      console.log(`Found event: ${event.title || event._id}`)
    } catch (eventError) {
      console.error("Error fetching event:", eventError)
      return NextResponse.json(
        {
          error: "Failed to fetch event. Please try again later.",
          details: eventError instanceof Error ? eventError.message : "Unknown error fetching event",
        },
        {
          status: 500,
          headers,
        },
      )
    }

    // Default values for form data
    let formStatus = "published"
    let questions = []

    try {
      // Safely extract form data based on form type
      if (normalizedFormType === "attendee") {
        // Check attendeeForm first (legacy)
        if (event.attendeeForm && typeof event.attendeeForm === "object") {
          formStatus = event.attendeeForm.status || "published"
        }
        // Then check forms.attendee (new structure)
        else if (event.forms && event.forms.attendee && typeof event.forms.attendee === "object") {
          formStatus = event.forms.attendee.status || "published"
        }

        // Get questions from either location
        if (event.customQuestions && Array.isArray(event.customQuestions.attendee)) {
          questions = event.customQuestions.attendee
        } else if (event.forms && event.forms.attendee && Array.isArray(event.forms.attendee.questions)) {
          questions = event.forms.attendee.questions
        }
      } else if (normalizedFormType === "volunteer") {
        if (event.volunteerForm && typeof event.volunteerForm === "object") {
          formStatus = event.volunteerForm.status || "published"
        } else if (event.forms && event.forms.volunteer && typeof event.forms.volunteer === "object") {
          formStatus = event.forms.volunteer.status || "published"
        }

        if (event.customQuestions && Array.isArray(event.customQuestions.volunteer)) {
          questions = event.customQuestions.volunteer
        } else if (event.forms && event.forms.volunteer && Array.isArray(event.forms.volunteer.questions)) {
          questions = event.forms.volunteer.questions
        }
      } else if (normalizedFormType === "speaker") {
        if (event.speakerForm && typeof event.speakerForm === "object") {
          formStatus = event.speakerForm.status || "published"
        } else if (event.forms && event.forms.speaker && typeof event.forms.speaker === "object") {
          formStatus = event.forms.speaker.status || "published"
        }

        if (event.customQuestions && Array.isArray(event.customQuestions.speaker)) {
          questions = event.customQuestions.speaker
        } else if (event.forms && event.forms.speaker && Array.isArray(event.forms.speaker.questions)) {
          questions = event.forms.speaker.questions
        }
      }

      console.log(`Form status: ${formStatus}`)
      console.log(`Found ${questions.length} questions`)

      // Add default questions if none exist
      if (!questions || questions.length === 0) {
        console.log("No custom questions found, adding default questions")
        questions = getDefaultQuestions(normalizedFormType)
      }
    } catch (formError) {
      console.error(`Error extracting form data:`, formError)
      // Don't fail the request, just use default questions
      questions = getDefaultQuestions(normalizedFormType)
    }

    // Check if event has already started or passed
    const now = new Date()
    let eventDate = null
    let isEventPassed = false

    try {
      if (event.date) {
        console.log(`Event date: ${event.date}`)
        eventDate = new Date(event.date)

        // If event has a start time, use it for comparison
        if (event.startTime && typeof event.startTime === "string") {
          console.log(`Event start time: ${event.startTime}`)
          const timeParts = event.startTime.split(":")
          if (timeParts.length >= 2) {
            const hours = Number.parseInt(timeParts[0], 10)
            const minutes = Number.parseInt(timeParts[1], 10)
            if (!isNaN(hours) && !isNaN(minutes)) {
              eventDate.setHours(hours, minutes, 0, 0)
            }
          }
        } else {
          // If no start time, set to end of day to allow registration until the event day ends
          eventDate.setHours(23, 59, 59, 999)
        }

        // Log date comparison for debugging
        console.log(`Current time: ${now.toISOString()}`)
        console.log(`Event time: ${eventDate.toISOString()}`)
        console.log(`Is event passed: ${now >= eventDate}`)

        isEventPassed = now >= eventDate
      } else {
        console.log("No event date found")
      }
    } catch (dateError) {
      console.error("Error parsing event date:", dateError)
      // Don't fail the request, just assume event hasn't passed
    }

    // If event has passed, override form status to closed
    if (isEventPassed) {
      formStatus = "closed"
      console.log("Form status set to closed because event has passed")
    }

    // Prepare the response data
    const responseData = {
      questions: Array.isArray(questions) ? questions : [],
      status: formStatus || "published",
      eventTitle: event.title || event.displayName || "Event",
      eventSlug: event.slug || eventId,
      eventDate: event.date || null,
      startTime: event.startTime || null,
      endTime: event.endTime || null,
      location: event.location || null,
      capacity: event.capacity || null,
      isEventPassed: isEventPassed,
    }

    console.log("Sending successful response")

    // Return the questions, status, and event details
    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error(`Unhandled error in form API route:`, error)

    // Ensure we return a proper JSON response even for unhandled errors
    return new NextResponse(
      JSON.stringify({
        error: "An unexpected error occurred. Please try again later.",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers,
      },
    )
  }
}

// Helper function to get default questions based on form type
function getDefaultQuestions(formType: string) {
  const commonQuestions = [
    {
      id: "name",
      type: "text",
      label: "Full Name",
      placeholder: "Enter your full name",
      required: true,
    },
    {
      id: "email",
      type: "email",
      label: "Email Address",
      placeholder: "Enter your email address",
      required: true,
    },
    {
      id: "phone",
      type: "text",
      label: "Phone Number",
      placeholder: "Enter your phone number",
      required: true,
    },
  ]

  if (formType === "attendee") {
    return [
      ...commonQuestions,
      {
        id: "organization",
        type: "text",
        label: "Organization/Company",
        placeholder: "Enter your organization or company name",
        required: false,
      },
      {
        id: "dietaryRestrictions",
        type: "text",
        label: "Dietary Restrictions",
        placeholder: "Enter any dietary restrictions or preferences",
        required: false,
      },
    ]
  } else if (formType === "volunteer") {
    return [
      ...commonQuestions,
      {
        id: "availability",
        type: "textarea",
        label: "Availability",
        placeholder: "Please describe your availability for this event",
        required: true,
      },
      {
        id: "experience",
        type: "textarea",
        label: "Previous Volunteer Experience",
        placeholder: "Describe any previous volunteer experience you have",
        required: false,
      },
      {
        id: "interests",
        type: "textarea",
        label: "Areas of Interest",
        placeholder: "What areas are you interested in volunteering for?",
        required: true,
      },
    ]
  } else if (formType === "speaker") {
    return [
      ...commonQuestions,
      {
        id: "title",
        type: "text",
        label: "Talk Title",
        placeholder: "Enter the title of your proposed talk",
        required: true,
      },
      {
        id: "abstract",
        type: "textarea",
        label: "Talk Abstract",
        placeholder: "Provide a brief abstract of your talk (250 words max)",
        required: true,
      },
      {
        id: "bio",
        type: "textarea",
        label: "Speaker Bio",
        placeholder: "Provide a short bio about yourself (150 words max)",
        required: true,
      },
      {
        id: "previousExperience",
        type: "textarea",
        label: "Previous Speaking Experience",
        placeholder: "Describe your previous speaking experience",
        required: false,
      },
    ]
  }

  // Default to attendee questions if form type is not recognized
  return commonQuestions
}
