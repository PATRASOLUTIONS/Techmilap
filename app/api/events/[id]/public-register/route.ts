import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { sendFormSubmissionNotification } from "@/lib/email-service"

// Import models
const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
const FormSubmission =
  mongoose.models.FormSubmission ||
  mongoose.model(
    "FormSubmission",
    new mongoose.Schema({
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      formType: { type: String, required: true, enum: ["attendee", "volunteer", "speaker"] },
      status: { type: String, default: "pending", enum: ["pending", "approved", "rejected"] },
      data: { type: mongoose.Schema.Types.Mixed, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }),
  )

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(params.id)
    let event = null

    if (isValidObjectId) {
      // If it's a valid ObjectId, try to find by ID first
      event = await Event.findById(params.id)
    }

    // If not found by ID or not a valid ObjectId, try to find by slug
    if (!event) {
      event = await Event.findOne({ slug: params.id })
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Get the form data from the request
    const formData = await req.json()

    // Create a name field from firstName and lastName
    const name = `${formData.firstName} ${formData.lastName}`.trim()

    // Create a new form submission for the attendee
    const formSubmission = new FormSubmission({
      eventId: event._id,
      formType: "attendee",
      status: "pending", // Always set to pending initially
      data: {
        ...formData,
        name, // Add the combined name field
      },
    })

    await formSubmission.save()

    // Add the registration to the event's registrations array
    // But set the status to pending
    if (!event.registrations) {
      event.registrations = []
    }

    event.registrations.push({
      name,
      email: formData.email,
      status: "pending", // Set to pending initially
      registeredAt: new Date(),
      formSubmissionId: formSubmission._id,
    })

    await event.save()

    // Send notification to the event organizer about the new registration
    // Only send notification about the submission, not approval
    try {
      const organizer = await mongoose.models.User.findById(event.organizer)
      if (organizer && organizer.email) {
        await sendFormSubmissionNotification({
          eventName: event.title,
          formType: "attendee",
          submissionData: formData,
          recipientEmail: organizer.email,
          recipientName: organizer.firstName,
          eventId: event._id.toString(),
          submissionId: formSubmission._id.toString(),
        })
      }
    } catch (error) {
      console.error("Error sending notification:", error)
      // Don't fail the registration if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Registration submitted successfully and pending approval",
    })
  } catch (error: any) {
    console.error("Error registering for event:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while registering for the event" },
      { status: 500 },
    )
  }
}
