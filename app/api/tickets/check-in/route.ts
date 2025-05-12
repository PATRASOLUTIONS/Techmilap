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
const User = mongoose.models.User || mongoose.model("User", require("@/models/User").default.schema)

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

    console.log(`[CHECK-IN] Processing check-in request for event ${eventId}, ticket ${ticketId}`)

    // Check if the event exists and the user has permission
    const event = await Event.findById(eventId)
    if (!event) {
      console.log(`[CHECK-IN] Event not found: ${eventId}`)
      return NextResponse.json(
        {
          error: "Event not found",
          success: false,
          status: "invalid",
          message: `Event with ID ${eventId} not found`,
        },
        { status: 404 },
      )
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      console.log(`[CHECK-IN] Permission denied for user ${session.user.id}`)
      return NextResponse.json(
        {
          error: "Forbidden: You don't have permission to check in attendees for this event",
          success: false,
          status: "invalid",
          message: "You don't have permission to check in attendees for this event",
        },
        { status: 403 },
      )
    }

    console.log(`[CHECK-IN] Event found: ${event.title}, looking up ticket: ${ticketId}`)

    // Debug: Get all attendee submissions for this event to check if they exist
    const allSubmissions = await FormSubmission.find({
      eventId: eventId,
      formType: "attendee",
      status: "approved",
    }).limit(5)

    console.log(`[CHECK-IN] Found ${allSubmissions.length} approved attendee submissions for this event`)
    if (allSubmissions.length > 0) {
      console.log(`[CHECK-IN] Sample submission ID: ${allSubmissions[0]._id}`)
      console.log(
        `[CHECK-IN] Sample submission data:`,
        JSON.stringify({
          name: allSubmissions[0].userName || extractNameFromFormData(allSubmissions[0].formData, allSubmissions[0]),
          email: allSubmissions[0].userEmail || extractEmailFromFormData(allSubmissions[0].formData, allSubmissions[0]),
          formData: allSubmissions[0].formData ? Object.keys(allSubmissions[0].formData) : "No form data",
        }),
      )
    }

    // First, try to find the ticket by ID
    let ticket = null
    let attendeeInfo = null
    let formSubmission = null
    let lookupMethod = "id"

    console.log(`[CHECK-IN] Looking up ticket with ID: ${ticketId}`)

    // Check if it's a valid MongoDB ObjectId
    if (mongoose.isValidObjectId(ticketId)) {
      console.log(`[CHECK-IN] Valid ObjectId, trying direct lookup`)
      // Try to find as a Ticket first
      ticket = await Ticket.findById(ticketId)
      if (ticket) {
        console.log(`[CHECK-IN] Found ticket by ID: ${ticket._id}`)
      }

      // If not found as a Ticket, try to find it as a FormSubmission
      if (!ticket) {
        formSubmission = await FormSubmission.findById(ticketId)
        if (formSubmission) {
          console.log(`[CHECK-IN] Found form submission by ID: ${formSubmission._id}`)
        }
      }
    }

    // If not found by ID, try other lookup methods
    if (!ticket && !formSubmission) {
      console.log(`[CHECK-IN] Not found by ID, trying other lookup methods`)
      lookupMethod = "email_or_name"

      // Try to find by email in FormSubmission
      const emailQuery = {
        eventId: eventId,
        formType: "attendee",
        status: "approved",
        $or: [{ userEmail: ticketId }, { "formData.email": ticketId }, { "formData.emailAddress": ticketId }],
      }

      console.log(`[CHECK-IN] Trying email lookup with query:`, JSON.stringify(emailQuery))
      formSubmission = await FormSubmission.findOne(emailQuery)

      if (formSubmission) {
        console.log(`[CHECK-IN] Found submission by email: ${formSubmission._id}`)
      } else {
        // Try to find by name in FormSubmission
        const nameQuery = {
          eventId: eventId,
          formType: "attendee",
          status: "approved",
          $or: [{ userName: ticketId }, { "formData.name": ticketId }, { "formData.fullName": ticketId }],
        }

        console.log(`[CHECK-IN] Trying name lookup with query:`, JSON.stringify(nameQuery))
        formSubmission = await FormSubmission.findOne(nameQuery)

        if (formSubmission) {
          console.log(`[CHECK-IN] Found submission by name: ${formSubmission._id}`)
        }
      }

      // If still not found, try a more flexible search
      if (!formSubmission) {
        console.log(`[CHECK-IN] Not found by exact match, trying flexible search`)

        // Try to find by partial email match
        const flexibleEmailQuery = {
          eventId: eventId,
          formType: "attendee",
          status: "approved",
          $or: [{ userEmail: { $regex: ticketId, $options: "i" } }],
        }

        console.log(`[CHECK-IN] Trying flexible email lookup`)
        formSubmission = await FormSubmission.findOne(flexibleEmailQuery)

        if (formSubmission) {
          console.log(`[CHECK-IN] Found submission by flexible email: ${formSubmission._id}`)
        }
      }

      // If still not found, try to find by user ID
      if (!formSubmission && mongoose.isValidObjectId(ticketId)) {
        console.log(`[CHECK-IN] Trying to find by user ID`)

        // Find user first
        const user = await User.findById(ticketId)

        if (user) {
          console.log(`[CHECK-IN] Found user: ${user._id}, ${user.email}`)

          // Find submission by user email
          formSubmission = await FormSubmission.findOne({
            eventId: eventId,
            formType: "attendee",
            status: "approved",
            userEmail: user.email,
          })

          if (formSubmission) {
            console.log(`[CHECK-IN] Found submission by user email: ${formSubmission._id}`)
          }
        }
      }
    }

    // Process FormSubmission if found
    if (formSubmission) {
      console.log(`[CHECK-IN] Processing form submission: ${formSubmission._id}`)

      // Verify this submission is for the correct event
      if (formSubmission.eventId.toString() !== eventId) {
        console.log(`[CHECK-IN] Submission is for different event: ${formSubmission.eventId} vs ${eventId}`)
        return NextResponse.json({
          success: false,
          status: "invalid",
          message: "This ticket is for a different event",
          debug: {
            submissionEventId: formSubmission.eventId.toString(),
            requestedEventId: eventId,
            lookupMethod,
          },
        })
      }

      // Verify this is an approved attendee submission
      if (formSubmission.formType !== "attendee" || formSubmission.status !== "approved") {
        console.log(
          `[CHECK-IN] Submission is not an approved attendee: ${formSubmission.formType}, ${formSubmission.status}`,
        )
        return NextResponse.json({
          success: false,
          status: "invalid",
          message: "This is not a valid approved ticket",
          debug: {
            formType: formSubmission.formType,
            status: formSubmission.status,
            lookupMethod,
          },
        })
      }

      // Extract attendee info from form data
      const formData = formSubmission.formData || {}

      // Log the form data for debugging
      console.log(`[CHECK-IN] Form data:`, JSON.stringify(formData, null, 2))

      const name = extractNameFromFormData(formData, formSubmission)
      const email = extractEmailFromFormData(formData, formSubmission)

      console.log(`[CHECK-IN] Extracted name: ${name}, email: ${email}`)

      // Extract attendee info
      attendeeInfo = {
        name: name || formSubmission.userName || "Unknown",
        email: email || formSubmission.userEmail || "No email",
        registeredAt: formSubmission.createdAt,
        ticketType: "Standard",
        formData: formData,
      }

      // Update the check-in status
      const now = new Date()
      const checkInCount = formSubmission.checkInCount || 0

      const updateResult = await FormSubmission.findByIdAndUpdate(
        formSubmission._id,
        {
          $inc: { checkInCount: 1 },
          $set: {
            isCheckedIn: true,
            checkedInAt: formSubmission.checkedInAt || now,
            lastCheckedInAt: now,
            checkedInBy: new mongoose.Types.ObjectId(session.user.id),
          },
        },
        { new: true },
      )

      // Check if already checked in
      if (checkInCount > 0) {
        console.log(`[CHECK-IN] Already checked in ${checkInCount} times`)
        return NextResponse.json({
          success: false,
          status: "already_checked_in",
          message: "This attendee has already been checked in",
          checkInCount: updateResult.checkInCount,
          checkedInAt: updateResult.checkedInAt,
          lastCheckedInAt: updateResult.lastCheckedInAt,
          attendee: attendeeInfo,
          debug: {
            submissionId: formSubmission._id.toString(),
            lookupMethod,
          },
        })
      }

      console.log(`[CHECK-IN] Successfully checked in attendee: ${name}`)
      return NextResponse.json({
        success: true,
        status: "checked_in",
        message: "Attendee successfully checked in",
        checkInCount: updateResult.checkInCount,
        checkedInAt: updateResult.checkedInAt,
        attendee: attendeeInfo,
        debug: {
          submissionId: formSubmission._id.toString(),
          lookupMethod,
        },
      })
    }

    // Process Ticket if found
    if (ticket) {
      console.log(`[CHECK-IN] Processing ticket: ${ticket._id}`)

      // Verify it's for the correct event
      if (ticket.event.toString() !== eventId) {
        console.log(`[CHECK-IN] Ticket is for different event: ${ticket.event} vs ${eventId}`)
        return NextResponse.json({
          success: false,
          status: "invalid",
          message: "This ticket is for a different event",
          debug: {
            ticketEventId: ticket.event.toString(),
            requestedEventId: eventId,
            lookupMethod,
          },
        })
      }

      // Update the check-in status
      const now = new Date()
      const checkInCount = ticket.checkInCount || 0

      ticket.checkInCount = (ticket.checkInCount || 0) + 1
      ticket.isCheckedIn = true
      ticket.checkedInAt = ticket.checkedInAt || now
      ticket.lastCheckedInAt = now
      ticket.checkedInBy = new mongoose.Types.ObjectId(session.user.id)
      await ticket.save()

      // Check if already checked in
      if (checkInCount > 0) {
        console.log(`[CHECK-IN] Ticket already checked in ${checkInCount} times`)
        return NextResponse.json({
          success: false,
          status: "already_checked_in",
          message: "This ticket has already been checked in",
          checkInCount: ticket.checkInCount,
          checkedInAt: ticket.checkedInAt,
          lastCheckedInAt: ticket.lastCheckedInAt,
          ticket,
          debug: {
            ticketId: ticket._id.toString(),
            lookupMethod,
          },
        })
      }

      console.log(`[CHECK-IN] Successfully checked in ticket: ${ticket._id}`)
      return NextResponse.json({
        success: true,
        status: "checked_in",
        message: "Ticket successfully checked in",
        checkInCount: ticket.checkInCount,
        checkedInAt: ticket.checkedInAt,
        ticket,
        debug: {
          ticketId: ticket._id.toString(),
          lookupMethod,
        },
      })
    }

    // If we get here, no ticket or submission was found
    console.log(`[CHECK-IN] No ticket or submission found for ID: ${ticketId}`)

    // Get a list of all events to check if the ticket might be for a different event
    const allEvents = await Event.find({}).limit(5).select("_id title")
    const eventsList = allEvents.map((e) => ({ id: e._id.toString(), title: e.title }))

    return NextResponse.json(
      {
        success: false,
        status: "invalid",
        message: "No valid ticket found with the provided ID. Please check the ID and try again.",
        debug: {
          providedTicketId: ticketId,
          eventId: eventId,
          lookupMethod,
          eventInfo: event ? { id: event._id.toString(), title: event.title } : null,
          otherEvents: eventsList,
        },
      },
      { status: 404 },
    )
  } catch (error: any) {
    console.error("[CHECK-IN] Error checking in ticket:", error)
    return NextResponse.json(
      {
        success: false,
        status: "error",
        message: error.message || "An error occurred while checking in the ticket",
        error: error.toString(),
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
