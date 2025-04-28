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

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ error: "No registration IDs provided" }, { status: 400 })
    }

    console.log(`Processing bulk approval for ${registrationIds.length} registrations`)

    // Update all form submissions
    const updatePromises = []
    const emailPromises = []
    const updatedSubmissions = []

    for (const regId of registrationIds) {
      if (mongoose.isValidObjectId(regId)) {
        // Update the submission status
        const updatePromise = FormSubmission.findOneAndUpdate(
          { _id: regId, eventId: event._id },
          { status: "approved", updatedAt: new Date() },
          { new: true },
        ).lean()

        updatePromises.push(updatePromise)
      }
    }

    // Wait for all updates to complete
    const results = await Promise.all(updatePromises)

    // Process the results and send emails
    for (const submission of results) {
      if (submission) {
        updatedSubmissions.push(submission)

        // If it's an attendee submission, also update the event registration status
        if (submission.formType === "attendee") {
          // Find the registration in the event.registrations array
          const registrationIndex = event.registrations?.findIndex(
            (reg) => reg.formSubmissionId && reg.formSubmissionId.toString() === submission._id.toString(),
          )

          if (registrationIndex >= 0) {
            // Update the status
            event.registrations[registrationIndex].status = "confirmed"
          }

          // Get the attendee's email and name from the submission data
          const attendeeEmail = submission.data.email || submission.data.corporateEmail || submission.userEmail
          const attendeeName =
            submission.data.name ||
            (submission.data.firstName
              ? `${submission.data.firstName} ${submission.data.lastName || ""}`.trim()
              : submission.userName || "Attendee")

          // Send approval email to the attendee
          if (attendeeEmail) {
            console.log(`Preparing to send approval email to ${attendeeEmail}`)

            const emailPromise = sendRegistrationApprovalEmail({
              eventName: event.title,
              attendeeEmail: attendeeEmail,
              attendeeName: attendeeName,
              eventDetails: {
                startDate: event.startDate || event.date,
                startTime: event.startTime,
                location: event.location,
                description: event.description,
              },
              eventId: event._id.toString(),
            }).catch((error) => {
              console.error(`Error sending approval email to ${attendeeEmail}:`, error)
              return false
            })

            emailPromises.push(emailPromise)
          }
        }
      }
    }

    // Save the event with updated registrations
    await event.save()

    // Wait for all emails to be sent
    const emailResults = await Promise.all(emailPromises)
    const successfulEmails = emailResults.filter((result) => result === true).length

    return NextResponse.json({
      success: true,
      message: `Successfully approved ${updatedSubmissions.length} registrations and sent ${successfulEmails} notification emails`,
      updatedCount: updatedSubmissions.length,
      emailsSent: successfulEmails,
    })
  } catch (error: any) {
    console.error("Error bulk approving registrations:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while bulk approving registrations" },
      { status: 500 },
    )
  }
}
