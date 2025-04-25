import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Get form questions for a specific form type
export async function GET(request: Request, { params }: { params: { id: string; formType: string } }) {
  try {
    const eventId = params.id
    const formType = params.formType // attendee, volunteer, or speaker

    console.log(`Fetching form config for eventId: ${eventId}, formType: ${formType}`)

    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      console.warn(`Invalid form type: ${formType}`)
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    // Connect to database
    console.log("Connecting to database...")
    const client = await connectToDatabase()
    const db = client.db()
    console.log("Connected to database")

    // Get the event
    console.log(`Fetching event with ID: ${eventId}`)
    let event

    try {
      event = await db.collection("events").findOne({
        _id: new ObjectId(eventId),
      })
    } catch (error) {
      console.error(`Error parsing ObjectId: ${eventId}`, error)
      // Try to find by slug if ObjectId parsing fails
      event = await db.collection("events").findOne({
        slug: eventId,
      })
    }

    if (!event) {
      console.warn(`Event not found with ID/slug: ${eventId}`)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log(`Found event: ${event.title}`)

    // Get the form status based on form type
    let formStatus = "published" // Default to published
    if (formType === "attendee" && event.attendeeForm && event.attendeeForm.status) {
      formStatus = event.attendeeForm.status
    } else if (formType === "volunteer" && event.volunteerForm && event.volunteerForm.status) {
      formStatus = event.volunteerForm.status
    } else if (formType === "speaker" && event.speakerForm && event.speakerForm.status) {
      formStatus = event.speakerForm.status
    }

    // Create default questions based on form type
    let defaultQuestions = []

    if (formType === "attendee") {
      defaultQuestions = [
        { id: "firstName", type: "text", label: "First Name", required: true },
        { id: "lastName", type: "text", label: "Last Name", required: true },
        { id: "email", type: "email", label: "Email", required: true },
      ]
    } else if (formType === "volunteer") {
      defaultQuestions = [
        { id: "name", type: "text", label: "Full Name", required: true },
        { id: "email", type: "email", label: "Email", required: true },
        { id: "phone", type: "text", label: "Phone Number", required: false },
        { id: "availability", type: "textarea", label: "Availability", required: true },
      ]
    } else if (formType === "speaker") {
      defaultQuestions = [
        { id: "name", type: "text", label: "Full Name", required: true },
        { id: "email", type: "email", label: "Email", required: true },
        { id: "topic", type: "text", label: "Presentation Topic", required: true },
        { id: "bio", type: "textarea", label: "Speaker Bio", required: true },
      ]
    }

    // Safely get custom questions
    let customQuestions = []
    if (event.customQuestions && Array.isArray(event.customQuestions[formType])) {
      customQuestions = event.customQuestions[formType]
    }

    // Combine default questions with custom questions
    const questions = [...defaultQuestions, ...customQuestions]

    console.log(
      `Form status: ${formStatus}, Questions found: ${questions.length} (${defaultQuestions.length} default, ${customQuestions.length} custom)`,
    )

    // Return the questions and status
    return NextResponse.json({
      questions: questions,
      status: formStatus,
    })
  } catch (error: any) {
    console.error(`Error fetching ${params.formType} form:`, error)
    return NextResponse.json({ error: error.message || "Failed to fetch form. Please try again." }, { status: 500 })
  }
}
