import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { extractNameFromFormData, extractEmailFromFormData } from "@/lib/ticket-utils"

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
    let formSubmission = null

    console.log(`Looking up ticket with ID: ${ticketId}`)

    // Check if it's a valid MongoDB ObjectId
    if (mongoose.isValidObjectId(ticketId)) {
      // Try to find as a Ticket first
      ticket = await Ticket.findById(ticketId)

      // If not found as a Ticket, try to find it as a FormSubmission
      if (!ticket) {
        formSubmission = await FormSubmission.findById(ticketId)
      }
    } else {
      // If not a valid ObjectId, try to find by other identifiers
      console.log("Not a valid ObjectId, trying other lookup methods")

      // Try to find by email in FormSubmission
      formSubmission = await FormSubmission.findOne({
        eventId: eventId,
        formType: "attendee",
        status: "approved",
        $or: [{ userEmail: ticketId }, { "formData.email": ticketId }, { "formData.emailAddress": ticketId }],
      })

      if (!formSubmission) {
        // Try to find by name in FormSubmission
        formSubmission = await FormSubmission.findOne({
          eventId: eventId,
          formType: "attendee",
          status: "approved",
          $or: [{ userName: ticketId }, { "formData.name": ticketId }, { "formData.fullName": ticketId }],
        })
      }
    }

    // Process FormSubmission if found
    if (formSubmission) {
      console.log("Found form submission:", formSubmission._id)

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

      // Extract attendee info from form data
      const formData = formSubmission.formData || {}

      // Log the form data for debugging
      console.log("Form data:", JSON.stringify(formData, null, 2))

      const name = extractNameFromFormData(formData, formSubmission)
      const email = extractEmailFromFormData(formData, formSubmission)

      console.log(`Extracted name: ${name}, email: ${email}`)

      // Extract attendee info
      attendeeInfo = {
        name: name || formSubmission.userName || "Unknown",
        email: email || formSubmission.userEmail || "No email",
        registeredAt: formSubmission.createdAt,
        ticketType: "Standard",
      }

      // Update the check-in status
      const now = new Date()
      const updateResult = await FormSubmission.findByIdAndUpdate(
        formSubmission._id,
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

    // Process Ticket if found
    if (ticket) {
      console.log("Found ticket:", ticket._id)

      // Verify it's for the correct event
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
    }

    // If we get here, no ticket or submission was found
    return NextResponse.json(
      {
        success: false,
        status: "invalid",
        message: "No valid ticket found with the provided ID. Please check the ID and try again.",
      },
      { status: 404 },
    )
  } catch (error: any) {
    console.error("Error checking in ticket:", error)
    return NextResponse.json(
      {
        success: false,
        status: "error",
        message: error.message || "An error occurred while checking in the ticket",
        error: error.toString(),
      },
      { status: 500 },
    )
  }
}
