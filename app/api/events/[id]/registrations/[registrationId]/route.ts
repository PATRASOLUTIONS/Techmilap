import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { sendRegistrationApprovalEmail, sendRegistrationRejectionEmail } from "@/lib/email-service"

// Import models
const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
const User = mongoose.models.User || mongoose.model("User", require("@/models/User").default.schema)
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
      console.log("Unauthorized: No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    console.log("Connected to database")

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
      console.log("Event not found:", params.id)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      console.log("Forbidden: User is not the organizer or super-admin")
      return NextResponse.json({ error: "Forbidden: You don't have permission to update this event" }, { status: 403 })
    }

    const { status } = await req.json()
    console.log("Requested status update:", status)

    // Check if this is a form submission ID
    if (mongoose.isValidObjectId(params.registrationId)) {
      console.log("Valid registration ID, looking for form submission")

      // Try to update the form submission
      const submission = await FormSubmission.findOneAndUpdate(
        { _id: params.registrationId, eventId: event._id },
        { status, updatedAt: new Date() },
        { new: true },
      )

      if (submission) {
        console.log("Found and updated submission:", submission._id, "New status:", status)

        // Get the attendee email and name from the submission
        const attendeeEmail = submission.userEmail || submission.data?.email
        const attendeeName =
          submission.userName ||
          submission.data?.name ||
          (submission.data?.firstName && submission.data?.lastName
            ? `${submission.data.firstName} ${submission.data.lastName}`
            : "Attendee")

        console.log("Attendee info:", { attendeeEmail, attendeeName })

        // If it's an attendee submission, also update the event registration status
        if (submission.formType === "attendee") {
          console.log("This is an attendee submission")

          // Find the registration in the event.registrations array
          const registrationIndex = event.registrations?.findIndex(
            (reg) => reg.formSubmissionId && reg.formSubmissionId.toString() === submission._id.toString(),
          )

          if (registrationIndex >= 0) {
            console.log("Found matching registration in event.registrations array at index:", registrationIndex)

            // Update the status
            event.registrations[registrationIndex].status = status === "approved" ? "confirmed" : status
            await event.save()
            console.log("Updated event registration status")

            // Send email notification based on the status
            if (status === "approved" && attendeeEmail) {
              console.log("Sending approval email to:", attendeeEmail)

              try {
                const emailSent = await sendRegistrationApprovalEmail({
                  eventName: event.title,
                  attendeeEmail,
                  attendeeName,
                  eventDetails: {
                    startDate: event.startDate,
                    startTime: event.startTime,
                    location: event.location,
                  },
                  eventId: event._id.toString(),
                })

                console.log("Approval email sent:", emailSent)
              } catch (emailError) {
                console.error("Error sending approval email:", emailError)
              }
            } else if (status === "rejected" && attendeeEmail) {
              console.log("Sending rejection email to:", attendeeEmail)

              try {
                const emailSent = await sendRegistrationRejectionEmail({
                  eventName: event.title,
                  attendeeEmail,
                  attendeeName,
                })

                console.log("Rejection email sent:", emailSent)
              } catch (emailError) {
                console.error("Error sending rejection email:", emailError)
              }
            }
          } else {
            console.log("Could not find matching registration in event.registrations array")
          }
        } else {
          console.log("This is not an attendee submission, it's a:", submission.formType)
        }

        return NextResponse.json({ success: true, submission })
      } else {
        console.log("No submission found with ID:", params.registrationId)
      }
    } else {
      console.log("Not a valid ObjectId for registration:", params.registrationId)
    }

    // If not a form submission or not found, check if it's an event registration
    // Extract the actual ID from the registration ID (which might be prefixed)
    const regIdParts = params.registrationId.split("_")
    const userId = regIdParts.length > 1 ? regIdParts[1] : null

    if (userId) {
      console.log("Checking for user-based registration with userId:", userId)

      // Find the registration in the event.registrations array
      const registrationIndex = event.registrations?.findIndex((reg) => reg.userId && reg.userId.toString() === userId)

      if (registrationIndex >= 0) {
        console.log("Found user-based registration at index:", registrationIndex)

        // Update the status
        event.registrations[registrationIndex].status = status
        await event.save()
        console.log("Updated user-based registration status")

        // Try to find the user to get their email for notifications
        try {
          const user = await User.findById(userId)
          if (user && user.email) {
            console.log("Found user for notification:", user.email)

            // Send email notification based on the status
            if (status === "approved") {
              console.log("Sending approval email to user:", user.email)

              await sendRegistrationApprovalEmail({
                eventName: event.title,
                attendeeEmail: user.email,
                attendeeName: user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.email,
                eventDetails: {
                  startDate: event.startDate,
                  startTime: event.startTime,
                  location: event.location,
                },
                eventId: event._id.toString(),
              })
            } else if (status === "rejected") {
              console.log("Sending rejection email to user:", user.email)

              await sendRegistrationRejectionEmail({
                eventName: event.title,
                attendeeEmail: user.email,
                attendeeName: user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.email,
              })
            }
          } else {
            console.log("User not found or has no email:", userId)
          }
        } catch (userError) {
          console.error("Error finding user for notification:", userError)
        }

        return NextResponse.json({ success: true })
      } else {
        console.log("No registration found with userId:", userId)
      }
    }

    console.log("Registration not found")
    return NextResponse.json({ error: "Registration not found" }, { status: 404 })
  } catch (error: any) {
    console.error("Error updating registration status:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while updating the registration" },
      { status: 500 },
    )
  }
}
