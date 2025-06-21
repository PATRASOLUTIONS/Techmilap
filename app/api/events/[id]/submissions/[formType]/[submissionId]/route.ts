import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { isValidObjectId } from "mongoose"
import { sendRegistrationApprovalEmail, sendRegistrationRejectionEmail } from "@/lib/email-service"


// Import models
const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
const User = mongoose.models.User || mongoose.model("User", require("@/models/User").default.schema) // Ensure User model is correctly imported/defined
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

    // Validate the submissionId is a valid ObjectId
    if (!isValidObjectId(params.submissionId)) {
      return NextResponse.json({ error: `Invalid submission ID format: ${params.submissionId}` }, { status: 400 })
    }

    await connectToDatabase()

    // Check if the event exists
    const event = await Event.findById(params.id)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (
      event.organizer.toString() !== session.user.id &&
      session.user.role !== "admin" &&
      session.user.role !== "super-admin"
    ) {
      return NextResponse.json({ error: "Forbidden: You don't have permission to access this event" }, { status: 403 })
    }

    // Get the request body
    const { status, name, email } = await req.json()
    let emailSent = false

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Find the registration
    const registration = await FormSubmission.findById(params.submissionId)

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Update the registration status
    if (registration) {
      registration.status = status
      registration.updatedAt = new Date()
      await registration.save()
    }

    //get the userId from registration.userId
    //fetch the user with the id
    //if the status is approved, update the userType to "speaker"
    if (status === "approved" && registration.userId && params.formType === "speaker") {
      const user = await User.findById(registration.userId)
      if (user) {
        user.userType = "speaker"
        await user.save()
      }
    }


    // // Find and update the submission
    // const submission = await FormSubmission.findOneAndUpdate(
    //   {
    //     _id: params.submissionId,
    //     eventId: event._id,
    //     formType: params.formType,
    //   },
    //   {
    //     status,
    //     updatedAt: new Date(),
    //   },
    //   { new: true },
    // )

    // if (!submission) {
    //   return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    // }
    if (email && (status === "approved" || status === "rejected")) {
      let organizerUser = null
      let organizerEmail: string | null = null
      if (event.organizer && isValidObjectId(event.organizer)) {
        try {
          organizerUser = await User.findById(event.organizer).lean()
          if (organizerUser && organizerUser.email) {
            organizerEmail = organizerUser.email
          }
        } catch (error) {
          console.error("Error fetching organizer for email:", error)
        }
      }

      const emailEventDetails = {
        ...event.toObject(),
        organizerName: organizerUser?.name || `${organizerUser?.firstName || ""} ${organizerUser?.lastName || ""}`.trim() || "Event Organizer",
        attendeeId: registration.userId.toString(),
      }

      try {
        if (status === "approved") {
          emailSent = await sendRegistrationApprovalEmail({
            eventName: event.title,
            attendeeEmail: email,
            attendeeName: name,
            eventDetails: emailEventDetails,
            eventId: event._id.toString(),
            organizerEmail: organizerEmail || "",
            organizerId: event.organizer?.toString(),
          })
        } else if (status === "rejected") {
          emailSent = await sendRegistrationRejectionEmail({
            eventName: event.title,
            attendeeEmail: email,
            attendeeName: name,
            eventDetails: emailEventDetails,
            eventId: event._id.toString(),
            organizerEmail: organizerEmail || "",
            organizerId: event.organizer?.toString(),
          })
        }
        console.log(`Email notification for ${params.formType} ${emailSent ? "sent successfully" : "failed or not applicable"}`)
      } catch (emailError) {
        console.error(`Error sending ${params.formType} submission email:`, emailError)
      }
    }
    return NextResponse.json({
      success: true,
      message: `${params.formType} submission status updated to ${status}`,
    })
  } catch (error: any) {
    console.error(`Error updating ${params.formType} submission:`, error)
    return NextResponse.json(
      { error: error.message || `An error occurred while updating ${params.formType} submission` },
      { status: 500 },
    )
  }
}
