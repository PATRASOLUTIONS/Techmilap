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

    const { ticketId: rawTicketId, eventId, allowDuplicateCheckIn = false } = await req.json()

    // Clean the ticket ID by removing any "#" prefix
    const ticketId = rawTicketId.startsWith("#") ? rawTicketId.substring(1) : rawTicketId

    console.log(`Processing ticket check-in: Original ID "${rawTicketId}", Cleaned ID "${ticketId}"`)

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

    // Try to find the ticket by ID first
    let ticket = null
    let attendee = null
    let isObjectId = false

    try {
      // Check if the ticketId is a valid ObjectId
      if (ObjectId.isValid(ticketId)) {
        isObjectId = true

        // Try to find a ticket with this ID
        ticket = await db.collection("tickets").findOne({
          _id: new ObjectId(ticketId),
          eventId: new ObjectId(eventId),
        })

        // If no ticket found, try to find a form submission with this ID
        if (!ticket) {
          attendee = await db.collection("formSubmissions").findOne({
            _id: new ObjectId(ticketId),
            eventId: new ObjectId(eventId),
            formType: "attendee",
            status: "approved",
          })
        }
      }
    } catch (error) {
      console.error("Error searching by ObjectId:", error)
    }

    // If no ticket or attendee found by ID, try to find by email
    if (!ticket && !attendee) {
      // Try to find by email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (emailRegex.test(ticketId)) {
        console.log(`Searching by email: ${ticketId}`)

        // Try to find a ticket with this email
        ticket = await db.collection("tickets").findOne({
          attendeeEmail: ticketId,
          eventId: new ObjectId(eventId),
        })

        // If no ticket found, try to find a form submission with this email
        if (!ticket) {
          // First try exact email match
          attendee = await db.collection("formSubmissions").findOne({
            $or: [{ userEmail: ticketId }, { "formData.email": ticketId }, { "formData.emailAddress": ticketId }],
            eventId: new ObjectId(eventId),
            formType: "attendee",
            status: "approved",
          })
        }
      }
    }

    // If still no ticket or attendee found, try to find by name
    if (!ticket && !attendee && !isObjectId) {
      console.log(`Searching by name: ${ticketId}`)

      // Try to find a ticket with this name
      ticket = await db.collection("tickets").findOne({
        attendeeName: ticketId,
        eventId: new ObjectId(eventId),
      })

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
    }

    // If still no ticket or attendee found, try removing any special characters
    if (!ticket && !attendee) {
      // Clean the ID by removing special characters
      const cleanedId = ticketId.replace(/[^a-zA-Z0-9]/g, "")
      console.log(`Searching with cleaned ID (no special chars): ${cleanedId}`)

      if (cleanedId !== ticketId) {
        // Try to find by the cleaned ID
        if (ObjectId.isValid(cleanedId)) {
          ticket = await db.collection("tickets").findOne({
            _id: new ObjectId(cleanedId),
            eventId: new ObjectId(eventId),
          })

          if (!ticket) {
            attendee = await db.collection("formSubmissions").findOne({
              _id: new ObjectId(cleanedId),
              eventId: new ObjectId(eventId),
              formType: "attendee",
              status: "approved",
            })
          }
        }
      }
    }

    // If no ticket or attendee found, return error
    if (!ticket && !attendee) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid ticket found with the provided ID. Please check the ID and try again.",
          searchTerm: ticketId,
        },
        { status: 404 },
      )
    }

    // Prepare the response data
    const responseData: any = {
      success: true,
      message: "Check-in successful",
    }

    const now = new Date()

    // Handle ticket check-in
    if (ticket) {
      responseData.ticket = {
        _id: ticket._id,
        name: ticket.attendeeName,
        email: ticket.attendeeEmail,
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
        attendeeName: ticket.attendeeName,
        attendeeEmail: ticket.attendeeEmail,
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
        _id: attendee._id,
        name,
        email,
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
      { success: false, message: `Error processing check-in: ${error.message}` },
      { status: 500 },
    )
  }
}
