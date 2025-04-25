import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "@/lib/auth"
import { authOptions } from "@/lib/auth"
import { sendEmail } from "@/lib/email-service"

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

    // Check if this is a form submission ID
    if (mongoose.isValidObjectId(params.registrationId)) {
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
