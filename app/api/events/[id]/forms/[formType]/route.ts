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
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      console.warn(`Event not found with ID: ${eventId}`)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log(`Found event: ${event.title}`)

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

    console.log(`Form status: ${formStatus}, Questions found: ${questions.length}`)

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
