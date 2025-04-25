import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "@/lib/auth"
import { authOptions } from "@/lib/auth"
import {
  sendEmail,
  sendVolunteerApprovalEmail,
  sendSpeakerApprovalEmail,
  sendAttendeeApprovalEmail,
} from "@/lib/email-service"
import { format } from "date-fns"

// Import models
const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
const FormSubmission =
  mongoose.models.FormSubmission ||
  mongoose.model(
    "FormSubmission",
    new mongoose.Schema({
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: { type: String },
      userEmail: { type: String },
      formType: { type: String, required: true, enum: ["attendee", "volunteer", "speaker"] },
      status: { type: String, default: "pending", enum: ["pending", "approved", "rejected"] },
      data: { type: mongoose.Schema.Types.Mixed, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }),
  )

const User = mongoose.models.User || mongoose.model("User", require("@/models/User").default.schema)

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; formType: string; submissionId: string } },
) {
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
      return NextResponse.json({ error: "Forbidden: You don't have permission to access this event" }, { status: 403 })
    }

    const { status } = await req.json()

    // Find the organizer's details
    const organizer = await User.findById(event.organizer)
    const organizerName = organizer ? `${organizer.firstName} ${organizer.lastName}` : "Event Organizer"
    const organizerEmail = organizer ? organizer.email : session.user.email

    // Check if this is a form submission ID
    if (mongoose.isValidObjectId(params.submissionId)) {
      // Try to update the form submission
      const submission = await FormSubmission.findOneAndUpdate(
        {
          _id: params.submissionId,
          eventId: event._id,
          formType: params.formType,
        },
        {
          status,
          updatedAt: new Date(),
        },
        { new: true },
      )

      if (submission) {
        // If the status is approved, send an approval email based on the form type
        if (status === "approved") {
          const recipientEmail = submission.userEmail
          const recipientName = submission.userName || submission.data.name || "Participant"
          const eventDate = event.startDate ? format(new Date(event.startDate), "MMMM dd, yyyy 'at' h:mm a") : "TBD"
          const eventLocation = event.location || "TBD"

          try {
            if (params.formType === "volunteer") {
              await sendVolunteerApprovalEmail({
                eventName: event.title,
                eventDate,
                eventLocation,
                recipientEmail,
                recipientName,
                eventId: event._id.toString(),
                eventSlug: event.slug || "",
                organizerName,
                organizerEmail,
                volunteerRole: submission.data.role || submission.data.interests || "Volunteer",
                additionalInfo: "Please arrive 30 minutes before the event starts for orientation.",
              })
            } else if (params.formType === "speaker") {
              await sendSpeakerApprovalEmail({
                eventName: event.title,
                eventDate,
                eventLocation,
                recipientEmail,
                recipientName,
                eventId: event._id.toString(),
                eventSlug: event.slug || "",
                organizerName,
                organizerEmail,
                presentationTitle: submission.data.topic || submission.data.title || "Your presentation",
                additionalInfo:
                  "Please prepare your presentation materials and arrive 45 minutes before your scheduled time.",
              })
            } else if (params.formType === "attendee") {
              await sendAttendeeApprovalEmail({
                eventName: event.title,
                eventDate,
                eventLocation,
                recipientEmail,
                recipientName,
                eventId: event._id.toString(),
                eventSlug: event.slug || "",
                organizerName,
                organizerEmail,
                ticketId: `TICKET-${submission._id.toString().substring(0, 8).toUpperCase()}`,
                additionalInfo: "Don't forget to bring your ID for check-in.",
              })
            }
            console.log(`Approval email sent to ${recipientEmail} for ${params.formType} submission`)
          } catch (emailError) {
            console.error(`Error sending approval email to ${recipientEmail}:`, emailError)
          }
        } else {
          // Send email to the user confirming submission status update
          try {
            const userEmail = submission.userEmail
            const userName = submission.userName
            const eventName = event.title

            await sendEmail({
              to: userEmail,
              subject: `[TechEventPlanner] ${eventName} - ${params.formType} Submission Status Updated`,
              text: `Dear ${userName},

Your ${params.formType} submission for ${eventName} has been updated to ${status}.`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>${eventName} - ${params.formType} Submission Status Updated</h2>
                  <p>Dear ${userName},</p>
                  <p>Your ${params.formType} submission for ${eventName} has been updated to ${status}.</p>
                </div>
              `,
            })
            console.log(`Status update email sent to user ${userEmail}`)
          } catch (userEmailError) {
            console.error("Error sending status update email to user:", userEmailError)
          }
        }

        // If it's an attendee submission, also update the event registration status
        if (submission.formType === "attendee" && submission.userId) {
          // Find the registration in the event.registrations array
          const registrationIndex = event.registrations?.findIndex(
            (reg) => reg.userId && reg.userId.toString() === submission.userId.toString(),
          )

          if (registrationIndex >= 0) {
            // Update the status
            event.registrations[registrationIndex].status = status === "approved" ? "confirmed" : status
            await event.save()
          }
        }

        return NextResponse.json({ success: true, submission })
      }
    }

    // If not a form submission or not found, check if it's an event registration
    // Extract the actual ID from the registration ID (which might be prefixed)
    const regIdParts = params.submissionId.split("_")
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
