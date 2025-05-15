import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { ticketId, eventId, allowDuplicateCheckIn = false } = await req.json()

    if (!ticketId || !eventId) {
      return NextResponse.json({ success: false, message: "Ticket ID and Event ID are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // First, try to find the event
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    // Log the search parameters for debugging
    console.log(`Searching for ticket with ID: ${ticketId} for event: ${eventId}`)

    // Clean the ticket ID by removing any special characters if needed
    // This helps with IDs that might have # or other prefixes
    const cleanTicketId = ticketId.toString().replace(/^#/, "").trim()

    // Try to find the ticket by ID first
    let ticket = null
    let attendee = null
    let isObjectId = false
    let lookupMethod = "unknown"

    // First, try to find by ticketNumber field which might contain formatted IDs like #6825d1
    ticket = await db.collection("tickets").findOne({
      $or: [
        { ticketNumber: ticketId },
        { ticketNumber: cleanTicketId },
        { formattedId: ticketId },
        { formattedId: cleanTicketId },
      ],
      eventId: new ObjectId(eventId),
    })

    if (ticket) {
      lookupMethod = "ticketNumber"
    }

    // If no ticket found, try to find by custom ID fields that might be in use
    if (!ticket) {
      ticket = await db.collection("tickets").findOne({
        $or: [
          { customId: ticketId },
          { customId: cleanTicketId },
          { displayId: ticketId },
          { displayId: cleanTicketId },
          { referenceId: ticketId },
          { referenceId: cleanTicketId },
        ],
        eventId: new ObjectId(eventId),
      })

      if (ticket) {
        lookupMethod = "customId"
      }
    }

    // Try to find by ObjectId if it's valid
    if (!ticket && ObjectId.isValid(cleanTicketId)) {
      isObjectId = true

      // Try to find a ticket with this ID
      ticket = await db.collection("tickets").findOne({
        _id: new ObjectId(cleanTicketId),
        eventId: new ObjectId(eventId),
      })

      if (ticket) {
        lookupMethod = "objectId"
      }

      // If no ticket found, try to find a form submission with this ID
      if (!ticket) {
        attendee = await db.collection("formSubmissions").findOne({
          _id: new ObjectId(cleanTicketId),
          eventId: new ObjectId(eventId),
          formType: "attendee",
          status: "approved",
        })

        if (attendee) {
          lookupMethod = "objectId-submission"
        }
      }
    }

    // If still no ticket or attendee found, try to find by partial ID match
    // This is useful for IDs that might be shortened or partially entered
    if (!ticket && !attendee && cleanTicketId.length >= 5) {
      // Try to find tickets where the ID contains the search string
      const partialIdTickets = await db
        .collection("tickets")
        .find({
          $or: [
            { _id: { $regex: cleanTicketId, $options: "i" } },
            { ticketNumber: { $regex: cleanTicketId, $options: "i" } },
            { customId: { $regex: cleanTicketId, $options: "i" } },
            { displayId: { $regex: cleanTicketId, $options: "i" } },
            { referenceId: { $regex: cleanTicketId, $options: "i" } },
          ],
          eventId: new ObjectId(eventId),
        })
        .toArray()

      if (partialIdTickets.length > 0) {
        ticket = partialIdTickets[0] // Use the first match
        lookupMethod = "partialId"
      }
    }

    // If no ticket or attendee found by ID, try to find by email
    if (!ticket && !attendee) {
      // Try to find by email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (emailRegex.test(ticketId)) {
        console.log(`Searching by email: ${ticketId}`)

        // Try to find a ticket with this email
        ticket = await db.collection("tickets").findOne({
          $or: [{ attendeeEmail: ticketId }, { email: ticketId }],
          eventId: new ObjectId(eventId),
        })

        if (ticket) {
          lookupMethod = "email-ticket"
        }

        // If no ticket found, try to find a form submission with this email
        if (!ticket) {
          // First try exact email match
          attendee = await db.collection("formSubmissions").findOne({
            $or: [{ userEmail: ticketId }, { "formData.email": ticketId }, { "formData.emailAddress": ticketId }],
            eventId: new ObjectId(eventId),
            formType: "attendee",
            status: "approved",
          })

          if (attendee) {
            lookupMethod = "email-submission"
          }
        }
      }
    }

    // If still no ticket or attendee found, try to find by name
    if (!ticket && !attendee && !isObjectId) {
      console.log(`Searching by name: ${ticketId}`)

      // Try to find a ticket with this name
      ticket = await db.collection("tickets").findOne({
        $or: [{ attendeeName: ticketId }, { name: ticketId }],
        eventId: new ObjectId(eventId),
      })

      if (ticket) {
        lookupMethod = "name-exact"
      }

      // If no ticket found, try to find a form submission with this name
      if (!ticket) {
        // Try to find by name (case insensitive)
        attendee = await db.collection("formSubmissions").findOne({
          $or: [
            { "formData.name": { $regex: new RegExp(`^${ticketId}$`, "i") } },
            { "formData.fullName": { $regex: new RegExp(`^${ticketId}$`, "i") } },
            { userName: { $regex: new RegExp(`^${ticketId}$`, "i") } },
          ],
          eventId: new ObjectId(eventId),
          formType: "attendee",
          status: "approved",
        })

        if (attendee) {
          lookupMethod = "name-submission"
        }
      }
    }

    // If still no exact match, try a more flexible search for name
    if (!ticket && !attendee && !isObjectId && ticketId.length > 3) {
      console.log(`Performing flexible name search for: ${ticketId}`)

      // Try to find a form submission with a similar name
      attendee = await db.collection("formSubmissions").findOne({
        $or: [
          { "formData.name": { $regex: new RegExp(ticketId, "i") } },
          { "formData.fullName": { $regex: new RegExp(ticketId, "i") } },
          { userName: { $regex: new RegExp(ticketId, "i") } },
        ],
        eventId: new ObjectId(eventId),
        formType: "attendee",
        status: "approved",
      })

      if (attendee) {
        lookupMethod = "name-partial"
      }
    }

    // If no ticket or attendee found, try a last-resort search in all fields
    if (!ticket && !attendee) {
      console.log(`Performing last-resort search for: ${ticketId}`)

      // Search in all possible fields with a flexible approach
      const lastResortTickets = await db
        .collection("tickets")
        .find({
          $or: [
            { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: cleanTicketId, options: "i" } } },
            { $expr: { $regexMatch: { input: { $toString: "$userId" }, regex: cleanTicketId, options: "i" } } },
            { notes: { $regex: cleanTicketId, $options: "i" } },
            { "metadata.reference": { $regex: cleanTicketId, $options: "i" } },
          ],
          eventId: new ObjectId(eventId),
        })
        .limit(1)
        .toArray()

      if (lastResortTickets.length > 0) {
        ticket = lastResortTickets[0]
        lookupMethod = "last-resort"
      }
    }

    // If no ticket or attendee found, return error
    if (!ticket && !attendee) {
      // Log all tickets for this event to help diagnose the issue
      const allTickets = await db
        .collection("tickets")
        .find({
          eventId: new ObjectId(eventId),
        })
        .limit(5)
        .toArray()

      console.log(
        `No ticket found. Sample tickets for event ${eventId}:`,
        allTickets.map((t) => ({
          _id: t._id.toString(),
          ticketNumber: t.ticketNumber,
          customId: t.customId,
          name: t.attendeeName || t.name,
        })),
      )

      return NextResponse.json(
        {
          success: false,
          status: "invalid",
          message: "No valid ticket found with the provided ID. Please check the ID and try again.",
          searchTerm: ticketId,
          cleanedSearchTerm: cleanTicketId,
          debug: {
            searchTerm: ticketId,
            cleanedTerm: cleanTicketId,
            eventId: eventId,
            lookupAttempted: true,
            sampleTicketCount: allTickets.length,
          },
        },
        { status: 404 },
      )
    }

    // Prepare the response data
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const responseData: any = {
      success: true,
      message: "Check-in successful",
      debug: {
        ticketId: ticketId,
        cleanedTicketId: cleanTicketId,
        searchTerm: ticketId,
        lookupMethod: lookupMethod,
        eventInfo: {
          id: eventId,
          title: event.title || "Event",
        },
      },
    }

    const now = new Date()

    // Handle ticket check-in
    if (ticket) {
      responseData.ticket = {
        _id: ticket._id.toString(),
        name: ticket.attendeeName || ticket.name,
        email: ticket.attendeeEmail || ticket.email,
        ticketNumber: ticket.ticketNumber,
        customId: ticket.customId,
        displayId: ticket.displayId,
        referenceId: ticket.referenceId,
      }

      // Check if already checked in
      if (ticket.isCheckedIn && !allowDuplicateCheckIn) {
        return NextResponse.json(
          {
            success: false,
            status: "already_checked_in",
            message: "This ticket has already been checked in",
            ticket: responseData.ticket,
            checkInCount: ticket.checkInCount || 1,
            checkedInAt: ticket.checkedInAt,
            debug: responseData.debug,
          },
          { status: 200 },
        )
      }

      // Update the ticket
      await db.collection("tickets").updateOne(
        { _id: ticket._id },
        {
          $set: {
            isCheckedIn: true,
            lastCheckedInAt: now,
            isWebCheckIn: true,
            webCheckInDate: now,
          },
          $inc: { checkInCount: 1 },
          $setOnInsert: { checkedInAt: ticket.checkedInAt || now },
        },
      )

      // Add check-in record
      await db.collection("checkIns").insertOne({
        ticketId: ticket._id,
        eventId: new ObjectId(eventId),
        attendeeName: ticket.attendeeName || ticket.name,
        attendeeEmail: ticket.attendeeEmail || ticket.email,
        checkedInAt: now,
        checkedInBy: session.user.id,
        checkedInByName: session.user.name,
        method: "web",
        isDuplicate: ticket.isCheckedIn ? true : false,
      })

      if (ticket.isCheckedIn) {
        responseData.status = "duplicate_check_in"
        responseData.message = "This ticket has been checked in again"
        responseData.checkInCount = (ticket.checkInCount || 1) + 1
      } else {
        responseData.status = "first_check_in"
        responseData.checkInCount = 1
      }

      responseData.checkedInAt = now
    }
    // Handle attendee check-in
    else if (attendee) {
      // Extract name and email from form data
      const formData = attendee.formData || {}
      const name =
        formData.name ||
        formData.fullName ||
        (formData.firstName && formData.lastName ? `${formData.firstName} ${formData.lastName}` : null) ||
        attendee.userName ||
        "Unknown"

      const email = formData.email || formData.emailAddress || attendee.userEmail || "No email"

      responseData.attendee = {
        _id: attendee._id.toString(),
        name,
        email,
        formData,
      }

      // Check if already checked in
      if (attendee.isCheckedIn && !allowDuplicateCheckIn) {
        return NextResponse.json(
          {
            success: false,
            status: "already_checked_in",
            message: "This attendee has already been checked in",
            attendee: responseData.attendee,
            checkInCount: attendee.checkInCount || 1,
            checkedInAt: attendee.checkedInAt,
            debug: responseData.debug,
          },
          { status: 200 },
        )
      }

      // Update the attendee
      await db.collection("formSubmissions").updateOne(
        { _id: attendee._id },
        {
          $set: {
            isCheckedIn: true,
            lastCheckedInAt: now,
            isWebCheckIn: true,
            webCheckInDate: now,
          },
          $inc: { checkInCount: 1 },
          $setOnInsert: { checkedInAt: attendee.checkedInAt || now },
        },
      )

      // Add check-in record
      await db.collection("checkIns").insertOne({
        submissionId: attendee._id,
        eventId: new ObjectId(eventId),
        attendeeName: name,
        attendeeEmail: email,
        checkedInAt: now,
        checkedInBy: session.user.id,
        checkedInByName: session.user.name,
        method: "web",
        isDuplicate: attendee.isCheckedIn ? true : false,
      })

      if (attendee.isCheckedIn) {
        responseData.status = "duplicate_check_in"
        responseData.message = "This attendee has been checked in again"
        responseData.checkInCount = (attendee.checkInCount || 1) + 1
      } else {
        responseData.status = "first_check_in"
        responseData.checkInCount = 1
      }

      responseData.checkedInAt = now
    }

    return NextResponse.json(responseData, { status: 200 })
  } catch (error: any) {
    console.error("Error in check-in API:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error processing check-in: ${error.message}`,
        status: "error",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
