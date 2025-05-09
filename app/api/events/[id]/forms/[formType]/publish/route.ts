import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    // Allow public access for testing purposes
    const isPublicRequest = request.headers.get("x-public-request") === "true"

    if (!isPublicRequest && !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, formType } = params
    const { status, questions } = await request.json()

    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    // Connect to the database
    await connectToDatabase()

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(id)

    // Find the event
    let event
    if (isValidObjectId) {
      event = await Event.findById(id)
    }

    // If not found by ID or not a valid ObjectId, try to find by slug
    if (!event && !isValidObjectId) {
      event = await Event.findOne({ slug: id })
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check permissions if not a public request
    if (!isPublicRequest && session) {
      const isOrganizer = event.organizer && event.organizer.toString() === session.user.id
      const isSuperAdmin = session.user.role === "super-admin"

      if (!isOrganizer && !isSuperAdmin) {
        return NextResponse.json(
          { error: "Forbidden: You don't have permission to update this event" },
          { status: 403 },
        )
      }
    }

    // Initialize forms object if it doesn't exist
    if (!event.forms) {
      event.forms = {}
    }

    // Update the form status and questions
    event.forms[formType] = {
      status,
      questions,
      updatedAt: new Date(),
    }

    // For backward compatibility, also update the old form status fields
    if (formType === "attendee") {
      event.attendeeForm = { status }
      if (Array.isArray(questions)) {
        event.customQuestions = { ...event.customQuestions, attendee: questions }
      }
    } else if (formType === "volunteer") {
      event.volunteerForm = { status }
      if (Array.isArray(questions)) {
        event.customQuestions = { ...event.customQuestions, volunteer: questions }
      }
    } else if (formType === "speaker") {
      event.speakerForm = { status }
      if (Array.isArray(questions)) {
        event.customQuestions = { ...event.customQuestions, speaker: questions }
      }
    }

    // Save the event
    await event.save()

    // Return success response with event slug
    return NextResponse.json({
      success: true,
      message: `Form ${status === "published" ? "published" : "updated"} successfully`,
      eventSlug: event.slug,
    })
  } catch (error) {
    console.error(`Error ${status === "published" ? "publishing" : "updating"} form:`, error)
    return NextResponse.json(
      { error: `Failed to ${status === "published" ? "publish" : "update"} form` },
      { status: 500 },
    )
  }
}
