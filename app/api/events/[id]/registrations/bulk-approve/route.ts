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

    // Process form submissions
    const validObjectIds = registrationIds.filter((id) => mongoose.isValidObjectId(id))

    if (validObjectIds.length > 0) {
      // Update all form submissions
      const result = await FormSubmission.updateMany(
        {
          _id: { $in: validObjectIds },
          eventId: event._id,
          status: "pending", // Only update pending submissions
        },
        {
          status: "approved",
          updatedAt: new Date(),
        },
      )

      // Get the updated submissions to send emails
      const updatedSubmissions = await FormSubmission.find({
        _id: { $in: validObjectIds },
        eventId: event._id,
        formType: "attendee",
        status: "approved",
      })

      // Update event registrations for attendee submissions
      if (updatedSubmissions.length > 0) {
        // Get all submission IDs
        const submissionIds = updatedSubmissions.map((sub) => sub._id.toString())

        // Update registrations in the event document
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

        // Send approval emails
        for (const submission of updatedSubmissions) {
          try {
            await sendRegistrationApprovalEmail({
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
          } catch (emailError) {
            console.error("Error sending approval email:", emailError)
            // Continue with other emails even if one fails
          }
        }
      }

      // Process event registrations (for IDs that start with "reg_")
      const regPrefixIds = registrationIds
        .filter((id) => id.startsWith("reg_"))
        .map((id) => {
          const parts = id.split("_")
          return parts.length > 1 ? parts[1] : null
        })
        .filter(Boolean)

      if (regPrefixIds.length > 0) {
        // Update registrations in the event document
        let updated = false

        if (event.registrations && event.registrations.length > 0) {
          event.registrations.forEach((reg, index) => {
            if (reg.userId && regPrefixIds.includes(reg.userId.toString())) {
              event.registrations[index].status = "confirmed"
              updated = true
            }
          })

          if (updated) {
            await event.save()
          }
        }
      }

      // Send approval emails to all approved attendees
      const approvedSubmissions = await FormSubmission.find({ _id: { $in: validObjectIds } }).lean()
      const eventDetails = await Event.findById(params.id).lean()

      if (eventDetails) {
        for (const submission of approvedSubmissions) {
          if (submission.formType === "attendee" && submission.data?.email) {
            try {
              await sendRegistrationApprovalEmail({
                eventName: eventDetails.title,
                attendeeEmail: submission.data.email,
                attendeeName: submission.data.name || `${submission.data.firstName} ${submission.data.lastName}`,
                eventDetails: {
                  startDate: eventDetails.startDate,
                  startTime: eventDetails.startTime,
                  location: eventDetails.location,
                },
                eventId: eventDetails._id.toString(),
              })
              console.log(`Sent approval email to ${submission.data.email}`)
            } catch (emailError) {
              console.error(`Failed to send approval email to ${submission.data.email}:`, emailError)
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully approved registrations`,
        count: result.modifiedCount,
      })
    }

    return NextResponse.json({ error: "No valid registration IDs provided" }, { status: 400 })
  } catch (error: any) {
    console.error("Error bulk approving registrations:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while approving registrations" },
      { status: 500 },
    )
  }
}
