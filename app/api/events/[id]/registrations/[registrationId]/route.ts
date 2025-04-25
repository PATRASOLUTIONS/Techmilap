import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "@/lib/auth"
import { authOptions } from "@/lib/auth"
import { sendAttendeeApprovalEmail } from "@/lib/email-service"
import { format } from "date-fns"

// Import models
const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
const User = mongoose.models.User || mongoose.model("User", require("@/models/User").default.schema)

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
      return NextResponse.json({ error: "Forbidden: You don't have permission to access this event" }, { status: 403 })
    }

    const { status } = await req.json()

    // Find the organizer's details
    const organizer = await User.findById(event.organizer)
    const organizerName = organizer ? `${organizer.firstName} ${organizer.lastName}` : "Event Organizer"
    const organizerEmail = organizer ? organizer.email : session.user.email

    // Find the registration in the event.registrations array
    const registration = event.registrations?.find((reg) => reg.id === params.registrationId)

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Update the status
    registration.status = status
    await event.save()

    // If the status is approved, send an approval email
    if (status === "approved") {
      try {
        // Find the attendee's details
        let attendeeName = registration.name
        let attendeeEmail = registration.email

        // If there's a userId, try to get more details
        if (registration.userId) {
          const attendee = await User.findById(registration.userId)
          if (attendee) {
            attendeeName = `${attendee.firstName} ${attendee.lastName}` || attendeeName
            attendeeEmail = attendee.email || attendeeEmail
          }
        }

        const eventDate = event.startDate ? format(new Date(event.startDate), "MMMM dd, yyyy 'at' h:mm a") : "TBD"
        const eventLocation = event.location || "TBD"

        await sendAttendeeApprovalEmail({
          eventName: event.title,
          eventDate,
          eventLocation,
          recipientEmail: attendeeEmail,
          recipientName: attendeeName,
          eventId: event._id.toString(),
          eventSlug: event.slug || "",
          organizerName,
          organizerEmail,
          ticketId: `TICKET-${registration.id.substring(0, 8).toUpperCase()}`,
          additionalInfo: "Don't forget to bring your ID for check-in.",
        })
        console.log(`Approval email sent to ${attendeeEmail} for event registration`)
      } catch (emailError) {
        console.error(`Error sending approval email:`, emailError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating registration status:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while updating the registration" },
      { status: 500 },
    )
  }
}
