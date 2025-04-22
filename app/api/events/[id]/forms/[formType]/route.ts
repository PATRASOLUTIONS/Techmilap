import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import Event from "@/models/Event"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Get form questions for a specific form type
export async function GET(request: Request, { params }: { params: { id: string; formType: string } }) {
  try {
    const eventId = params.id
    const formType = params.formType // attendee, volunteer, or speaker
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    // Connect to database
    await connectToDatabase()

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(eventId)
    let event = null

    if (isValidObjectId) {
      // If it's a valid ObjectId, try to find by ID first
      event = await Event.findById(eventId).lean()
    }

    // If not found by ID or not a valid ObjectId, try to find by slug
    if (!event && !isValidObjectId) {
      event = await Event.findOne({ slug: eventId }).lean()
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You don't have permission to access this event" }, { status: 403 })
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

    // Return the questions and status
    return NextResponse.json({
      questions: questions,
      status: formStatus,
      eventSlug: event.slug,
    })
  } catch (error) {
    console.error(`Error fetching ${params.formType} form:`, error)
    return NextResponse.json({ error: "Failed to fetch form. Please try again." }, { status: 500 })
  }
}
