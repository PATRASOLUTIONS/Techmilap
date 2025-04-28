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
      formType: { type: String, required: true, enum: ["attendee", "volunteer", "speaker"] },
      status: { type: String, default: "pending", enum: ["pending", "approved", "rejected"] },
      data: { type: mongoose.Schema.Types.Mixed, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }),
  )

export async function PATCH(req: NextRequest, { params }: { params: { id: string; registrationId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You don't have permission to update this event" }, { status: 403 })
    }

    const { status } = await req.json()

    // Check if this is a form submission ID
    if (mongoose.isValidObjectId(params.registrationId)) {
      // Try to update the form submission
      const submission = await FormSubmission.findOneAndUpdate(
        { _id: params.registrationId, eventId: event._id },
        { status, updatedAt: new Date() },
        { new: true },
      )

      if (submission) {
        // If it's an attendee submission, also update the event registration status
        if (submission.formType === "attendee") {
          // Find the registration in the event.registrations array
          const registrationIndex = event.registrations?.findIndex(
            (reg) => reg.formSubmissionId && reg.formSubmissionId.toString() === submission._id.toString(),
          )

          if (registrationIndex >= 0) {
            // Update the status
            event.registrations[registrationIndex].status = status === "approved" ? "confirmed" : status
            await event.save()

            // Send email notification based on the status
            if (status === "approved") {
              try {
                // Send approval email to the attendee
                console.log(`Sending approval email to ${submission.data.email}`)
                const emailResult = await sendRegistrationApprovalEmail({
                  eventName: event.title,
                  attendeeEmail: submission.data.email,
                  attendeeName: submission.data.name || `${submission.data.firstName} ${submission.data.lastName}`,
                  eventDetails: {
                    startDate: event.startDate,
                    startTime: event.startTime,
                    location: event.location,
                  },
                  eventId: event._id.toString(),
                })

                console.log(`Email sending result: ${emailResult ? "Success" : "Failed"}`)

                if (!emailResult) {
                  console.error(`Failed to send approval email to ${submission.data.email}`)
                }
              } catch (emailError) {
                console.error("Error sending approval email:", emailError)
                // Continue with the process even if email fails
              }
            } else if (status === "rejected") {
              try {
                // Send rejection email to the attendee
                console.log(`Sending rejection email to ${submission.data.email}`)
                const emailResult = await sendRegistrationRejectionEmail({
                  eventName: event.title,
                  attendeeEmail: submission.data.email,
                  attendeeName: submission.data.name || `${submission.data.firstName} ${submission.data.lastName}`,
                })

                console.log(`Email sending result: ${emailResult ? "Success" : "Failed"}`)

                if (!emailResult) {
                  console.error(`Failed to send rejection email to ${submission.data.email}`)
                }
              } catch (emailError) {
                console.error("Error sending rejection email:", emailError)
                // Continue with the process even if email fails
              }
            }
          }
        }

        return NextResponse.json({ success: true, submission })
      }
    }

    // If not a form submission or not found, check if it's an event registration
    // Extract the actual ID from the registration ID (which might be prefixed)
    const regIdParts = params.registrationId.split("_")
    const userId = regIdParts.length > 1 ? regIdParts[1] : null

    if (userId) {
      // Find the registration in the event.registrations array
      const registrationIndex = event.registrations?.findIndex((reg) => reg.userId && reg.userId.toString() === userId)

      if (registrationIndex >= 0) {
        // Update the status
        event.registrations[registrationIndex].status = status
        await event.save()
        return NextResponse.json({ success: true })
      }
    }

    return NextResponse.json({ error: "Registration not found" }, { status: 404 })
  } catch (error: any) {
    console.error("Error updating registration status:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while updating the registration" },
      { status: 500 },
    )
  }
}
