import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { sendRegistrationApprovalEmail, sendRegistrationRejectionEmail } from "@/lib/email-service"

// Import models
const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
const FormSubmission =
  mongoose.models.FormSubmission ||
  mongoose.model(
    "FormSubmission",
    new mongoose.Schema({
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: String,
      userEmail: String,
      formType: { type: String, required: true, enum: ["attendee", "volunteer", "speaker"] },
      status: { type: String, default: "pending", enum: ["pending", "approved", "rejected"] },
      data: { type: mongoose.Schema.Types.Mixed, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }),
  )

export async function PATCH(req: NextRequest, { params }: { params: { id: string; registrationId: string } }) {
  try {
    console.log(`Updating registration status for event ${params.id}, registration ${params.registrationId}`)

    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Get the request body
    const body = await req.json()
    const { status } = body

    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    console.log(`Setting registration status to: ${status}`)

    // Find the event
    const event = await Event.findById(params.id)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You don't have permission to update this event" }, { status: 403 })
    }

    // Find the registration in the event
    const registrationIndex = event.registrations.findIndex((reg) => reg._id.toString() === params.registrationId)

    if (registrationIndex === -1) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Get the registration details before updating
    const registration = event.registrations[registrationIndex]
    const oldStatus = registration.status
    const attendeeEmail = registration.email
    const attendeeName = registration.name

    console.log(`Found registration: ${attendeeName} (${attendeeEmail}), current status: ${oldStatus}`)

    // Update the registration status
    event.registrations[registrationIndex].status = status
    await event.save()
    console.log(`Updated registration status in event to: ${status}`)

    // If there's a form submission ID, update that too
    if (registration.formSubmissionId) {
      const formSubmission = await FormSubmission.findById(registration.formSubmissionId)
      if (formSubmission) {
        formSubmission.status = status
        await formSubmission.save()
        console.log(`Updated form submission status to: ${status}`)
      } else {
        console.log(`Form submission not found: ${registration.formSubmissionId}`)
      }
    }

    // Send email notification to the attendee based on the new status
    if (attendeeEmail) {
      try {
        if (status === "approved" && oldStatus !== "approved") {
          console.log(`Sending approval email to ${attendeeEmail}`)

          const emailSent = await sendRegistrationApprovalEmail({
            eventName: event.title,
            attendeeEmail,
            attendeeName: attendeeName || "Attendee",
            eventDetails: {
              startDate: event.startDate,
              startTime: event.startTime,
              location: event.location,
            },
            eventId: event._id.toString(),
          })

          console.log(`Approval email sent: ${emailSent}`)
        } else if (status === "rejected" && oldStatus !== "rejected") {
          console.log(`Sending rejection email to ${attendeeEmail}`)

          const emailSent = await sendRegistrationRejectionEmail({
            eventName: event.title,
            attendeeEmail,
            attendeeName: attendeeName || "Attendee",
          })

          console.log(`Rejection email sent: ${emailSent}`)
        }
      } catch (emailError) {
        console.error("Error sending status update email:", emailError)
        // Don't fail the status update if email fails
      }
    } else {
      console.log("No attendee email found, skipping notification")
    }

    return NextResponse.json({
      success: true,
      message: `Registration status updated to ${status}`,
    })
  } catch (error: any) {
    console.error("Error updating registration status:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while updating registration status" },
      { status: 500 },
    )
  }
}
