import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { sendRegistrationApprovalEmail } from "@/lib/email-service"

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

    const { registrationIds } = await req.json()

    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ error: "No registration IDs provided" }, { status: 400 })
    }

    // Update all the form submissions
    const updatedSubmissions = await FormSubmission.updateMany(
      { _id: { $in: registrationIds }, eventId: event._id },
      { status: "approved", updatedAt: new Date() },
    )

    // Get the updated submissions to send emails
    const submissions = await FormSubmission.find({ _id: { $in: registrationIds }, eventId: event._id })

    // Send emails to all approved attendees
    const emailPromises = submissions.map(async (submission) => {
      try {
        if (submission.formType === "attendee" && submission.data?.email) {
          const emailResult = await sendRegistrationApprovalEmail({
            eventName: event.title,
            attendeeEmail: submission.data.email,
            attendeeName: submission.data.name || `${submission.data.firstName} ${submission.data.lastName}`,
            eventDetails: {
              startDate: event.startDate,
              startTime: event.startTime,
              location: event.location,
              description: event.description,
            },
            eventId: event._id.toString(),
          })

          console.log(`Email sending result for ${submission.data.email}: ${emailResult ? "Success" : "Failed"}`)
        }
      } catch (error) {
        console.error(`Error sending email to ${submission.data?.email}:`, error)
      }
    })

    // Wait for all emails to be sent (or fail)
    await Promise.allSettled(emailPromises)

    // Update the event registrations
    const submissionIds = submissions.map((sub) => sub._id.toString())

    if (event.registrations && event.registrations.length > 0) {
      let updated = false

      event.registrations.forEach((reg, index) => {
        if (reg.formSubmissionId && submissionIds.includes(reg.formSubmissionId.toString())) {
          event.registrations[index].status = "confirmed"
          updated = true
        }
      })

      if (updated) {
        await event.save()
      }
    }

    return NextResponse.json({
      success: true,
      message: `${updatedSubmissions.modifiedCount} registrations approved successfully. Notification emails have been sent.`,
    })
  } catch (error: any) {
    console.error("Error bulk approving registrations:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while bulk approving registrations" },
      { status: 500 },
    )
  }
}
