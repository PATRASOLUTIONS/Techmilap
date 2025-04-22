import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import Event from "@/models/Event"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: { id: string; formType: string } }) {
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

    const { status, questions } = await request.json()

    if (!status || !["draft", "published"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: "Questions must be an array" }, { status: 400 })
    }

    // Connect to database
    await connectToDatabase()

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(eventId)
    let event = null

    if (isValidObjectId) {
      // If it's a valid ObjectId, try to find by ID first
      event = await Event.findById(eventId)
    }

    // If not found by ID or not a valid ObjectId, try to find by slug
    if (!event && !isValidObjectId) {
      event = await Event.findOne({ slug: eventId })
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You don't have permission to update this event" }, { status: 403 })
    }

    // Initialize customQuestions if it doesn't exist
    if (!event.customQuestions) {
      event.customQuestions = {
        attendee: [],
        volunteer: [],
        speaker: [],
      }
    }

    // Update the questions for the specific form type
    event.customQuestions[formType] = questions

    // Update the form status
    if (formType === "attendee") {
      if (!event.attendeeForm) event.attendeeForm = {}
      event.attendeeForm.status = status
    } else if (formType === "volunteer") {
      if (!event.volunteerForm) event.volunteerForm = {}
      event.volunteerForm.status = status
    } else if (formType === "speaker") {
      if (!event.speakerForm) event.speakerForm = {}
      event.speakerForm.status = status
    }

    // Save the event
    await event.save()

    return NextResponse.json({
      success: true,
      status: status,
      eventSlug: event.slug,
    })
  } catch (error) {
    console.error(`Error updating ${params.formType} form:`, error)
    return NextResponse.json({ error: "Failed to update form. Please try again." }, { status: 500 })
  }
}
