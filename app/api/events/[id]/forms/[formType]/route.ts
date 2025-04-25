import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { generateDefaultQuestions } from "@/lib/form-utils"

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

    // Log the structure of customQuestions to debug
    console.log("customQuestions structure:", JSON.stringify(event.customQuestions || {}))

    // Get the form status based on form type
    let formStatus = "published" // Default to published
    if (formType === "attendee" && event.attendeeForm && event.attendeeForm.status) {
      formStatus = event.attendeeForm.status
    } else if (formType === "volunteer" && event.volunteerForm && event.volunteerForm.status) {
      formStatus = event.volunteerForm.status
    } else if (formType === "speaker" && event.speakerForm && event.speakerForm.status) {
      formStatus = event.speakerForm.status
    }

    // Get custom questions from the database
    let questions = []

    // First check if customQuestions exists and has the form type
    if (event.customQuestions && event.customQuestions[formType]) {
      console.log(`Found ${formType} questions in customQuestions:`, JSON.stringify(event.customQuestions[formType]))

      if (Array.isArray(event.customQuestions[formType])) {
        questions = event.customQuestions[formType]
      }
    }

    // If no custom questions found, generate default questions
    if (questions.length === 0) {
      console.log(`No custom questions found for ${formType}, generating defaults`)
      questions = generateDefaultQuestions(formType)
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
