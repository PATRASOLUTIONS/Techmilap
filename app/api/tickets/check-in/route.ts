import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Import models
const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", require("@/models/Ticket").default.schema)
const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
const FormSubmission =
  mongoose.models.FormSubmission || mongoose.model("FormSubmission", require("@/models/FormSubmission").default.schema)

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const { ticketId, eventId } = await req.json()

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    // Check if the event exists and the user has permission
    const event = await Event.findById(eventId)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to check in attendees for this event" },
        { status: 403 },
      )
    }

    // First, try to find the ticket by ID
    let ticket = null
    let attendeeInfo = null

    // Check if it's a valid MongoDB ObjectId
    if (mongoose.isValidObjectId(ticketId)) {
      ticket = await Ticket.findById(ticketId)
    }

    // If not found as a Ticket, try to find it as a FormSubmission
    if (!ticket) {
      const formSubmission = await FormSubmission.findById(ticketId)

      if (formSubmission) {
        // Verify this submission is for the correct event
        if (formSubmission.eventId.toString() !== eventId) {
          return NextResponse.json({
            success: false,
            status: "invalid",
            message: "This ticket is for a different event",
          })
        }

        // Verify this is an approved attendee submission
        if (formSubmission.formType !== "attendee" || formSubmission.status !== "approved") {
          return NextResponse.json({
            success: false,
            status: "invalid",
            message: "This is not a valid approved ticket",
          })
        }

        // Extract attendee info
        attendeeInfo = {
          name: formSubmission.userName || "Unknown",
          email: formSubmission.userEmail || "No email",
          registeredAt: formSubmission.createdAt,
          ticketType: "Standard",
        }

        // Update the check-in status
        const now = new Date()
        const updateResult = await FormSubmission.findByIdAndUpdate(
          ticketId,
          {
            $inc: { checkInCount: 1 },
            $set: {
              isCheckedIn: true,
              checkedInAt: now,
              checkedInBy: new mongoose.Types.ObjectId(session.user.id),
            },
          },
          { new: true },
        )

        // Check if already checked in
        if (updateResult.checkInCount > 1) {
          return NextResponse.json({
            success: false,
            status: "already_checked_in",
            message: "This attendee has already been checked in",
            checkInCount: updateResult.checkInCount,
            checkedInAt: updateResult.checkedInAt,
            attendee: attendeeInfo,
          })
        }

        return NextResponse.json({
          success: true,
          status: "checked_in",
          message: "Attendee successfully checked in",
          checkInCount: updateResult.checkInCount,
          checkedInAt: updateResult.checkedInAt,
          attendee: attendeeInfo,
        })
      }

      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // If we found a Ticket, verify it's for the correct event
    if (ticket.event.toString() !== eventId) {
      return NextResponse.json({
        success: false,
        status: "invalid",
        message: "This ticket is for a different event",
      })
    }

    // Update the check-in status
    const now = new Date()
    ticket.checkInCount += 1
    ticket.isCheckedIn = true
    ticket.checkedInAt = now
    ticket.checkedInBy = new mongoose.Types.ObjectId(session.user.id)
    await ticket.save()

    // Check if already checked in
    if (ticket.checkInCount > 1) {
      return NextResponse.json({
        success: false,
        status: "already_checked_in",
        message: "This ticket has already been checked in",
        checkInCount: ticket.checkInCount,
        checkedInAt: ticket.checkedInAt,
        ticket,
      })
    }

    return NextResponse.json({
      success: true,
      status: "checked_in",
      message: "Ticket successfully checked in",
      checkInCount: ticket.checkInCount,
      checkedInAt: ticket.checkedInAt,
      ticket,
    })
  } catch (error: any) {
    console.error("Error checking in ticket:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while checking in the ticket" },
      { status: 500 },
    )
  }
}
