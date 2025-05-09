import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import mongoose from "mongoose"

export async function POST(request, { params }) {
  try {
    const { id } = params

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

    // Initialize forms object if it doesn't exist
    if (!event.forms) {
      event.forms = {}
    }

    // Get the default questions for each form type
    const defaultQuestions = {
      attendee: event.customQuestions?.attendee || [],
      volunteer: event.customQuestions?.volunteer || [],
      speaker: event.customQuestions?.speaker || [],
    }

    // Update all form statuses to published
    event.forms.attendee = {
      status: "published",
      questions: defaultQuestions.attendee,
      updatedAt: new Date(),
    }

    event.forms.volunteer = {
      status: "published",
      questions: defaultQuestions.volunteer,
      updatedAt: new Date(),
    }

    event.forms.speaker = {
      status: "published",
      questions: defaultQuestions.speaker,
      updatedAt: new Date(),
    }

    // For backward compatibility, also update the old form status fields
    event.attendeeForm = { status: "published" }
    event.volunteerForm = { status: "published" }
    event.speakerForm = { status: "published" }

    // Save the event
    await event.save()

    // Return success response
    return NextResponse.json({
      success: true,
      message: "All forms published successfully",
      eventSlug: event.slug,
    })
  } catch (error) {
    console.error("Error publishing all forms:", error)
    return NextResponse.json({ error: "Failed to publish all forms" }, { status: 500 })
  }
}
