import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Get form questions for a specific form type
export async function GET(request: Request, { params }: { params: { id: string; formType: string } }) {
  try {
    const eventId = params.id
    const formType = params.formType // attendee, volunteer, or speaker

    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    console.log(`Fetching ${formType} form data for event ID: ${eventId}`)

    // Connect to database
    await connectToDatabase()
    const client = await connectToDatabase()
    const db = client.db()

    // Get the event
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Get the form status based on form type
    let formStatus = "draft"
    if (formType === "attendee" && event.attendeeForm) {
      formStatus = event.attendeeForm.status || "draft"
    } else if (formType === "volunteer" && event.volunteerForm) {
      formStatus = event.volunteerForm.status || "draft"
    } else if (formType === "speaker" && event.speakerForm) {
      formStatus = event.speakerForm.status || "draft"
    }

    // Safely get questions
    let questions = []
    if (event.customQuestions && Array.isArray(event.customQuestions[formType])) {
      questions = event.customQuestions[formType]
    }

    console.log(`Found ${questions.length} questions for ${formType} form`)

    // Return the questions and status
    return NextResponse.json({
      questions: questions,
      status: formStatus,
    })
  } catch (error) {
    console.error(`Error fetching ${params.formType} form:`, error)
    return NextResponse.json({ error: "Failed to fetch form. Please try again." }, { status: 500 })
  }
}
