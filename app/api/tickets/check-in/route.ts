import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Event from "@/models/Event";
import Ticket from "@/models/Ticket";
import FormSubmission from "@/models/FormSubmission";
import CheckIn from "@/models/CheckIn";

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

    await connectToDatabase();

    // First, try to find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 });
    }

    // Log the search parameters for debugging
    console.log(`Searching for ticket with ID: ${ticketId} for event: ${eventId}`)

    // Try to find the ticket by ID first
    let ticket = null
    let attendee = null
    let isObjectId = false
    if (ObjectId.isValid(ticketId)) {
      isObjectId = true;
      ticket = await Ticket.findOne({
        _id: ticketId,
        eventId: eventId,
      });

      // If not found in Ticket, try FormSubmission by ID
      if (!ticket) {
        attendee = await FormSubmission.findOne({
          _id: ticketId,
          eventId: eventId,
          formType: "attendee",
          status: "approved",
        });
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
          attendeeEmail: ticketId,
          eventId: eventId,
        })

        if (!ticket) {
          attendee = await FormSubmission.findOne({
            $or: [
              { userEmail: ticketId },
              { "formData.email": ticketId },
              { "formData.emailAddress": ticketId },
            ],
            eventId: eventId,
            formType: "attendee",
            status: "approved",
          });
        }
      }
    }

    // If still no ticket or attendee found, try to find by name (exact match, case-insensitive)
    if (!ticket && !attendee && !isObjectId) {
      ticket = await Ticket.findOne({
        attendeeName: ticketId,
        eventId: eventId,
      });

      if (!ticket) {
        attendee = await FormSubmission.findOne({
          $or: [
            { "formData.name": { $regex: new RegExp(`^${ticketId}$`, "i") } },
            { "formData.fullName": { $regex: new RegExp(`^${ticketId}$`, "i") } },
            { userName: { $regex: new RegExp(`^${ticketId}$`, "i") } },
          ],
          eventId: eventId,
          formType: "attendee",
          status: "approved",
        });
      }
    }

    // If still no exact match, try a more flexible search for name (partial match, case-insensitive)
    if (!ticket && !attendee && !isObjectId && ticketId.length > 3) {
      console.log(`Performing flexible name search for: ${ticketId}`)

      // Try to find a form submission with a similar name
      attendee = await db.collection("formSubmissions").findOne({
        $or: [
          { "formData.name": { $regex: ticketId, $options: "i" } },
          { "formData.fullName": { $regex: ticketId, $options: "i" } },
          { userName: { $regex: ticketId, $options: "i" } },
        ],
        eventId: eventId,
        formType: "attendee",
        status: "approved",
      });
    }

    // If still no ticket or attendee found, try removing any special characters
    if (!ticket && !attendee) {
      // Clean the ID by removing special characters
      const cleanedId = ticketId.replace(/[^a-zA-Z0-9]/g, "")
      console.log(`Searching with cleaned ID (no special chars): ${cleanedId}`)
      if (cleanedId !== ticketId && ObjectId.isValid(cleanedId)) {
        ticket = await Ticket.findOne({
          _id: cleanedId,
          eventId: eventId,
        });

        if (!ticket) {
          attendee = await FormSubmission.findOne({
            _id: cleanedId,
            eventId: eventId,
            formType: "attendee",
            status: "approved",
          });
        }
      }
    }

    // If still not found, return error
    if (!ticket && !attendee) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid ticket found with the provided ID. Please check the ID and try again.",
          searchTerm: ticketId,
        },
        { status: 404 }
      )
    }

    // Prepare the response data
    const responseData: any = {
      success: true,
      message: "Check-in successful",
    };

    const now = new Date();

    // Handle ticket check-in
    if (ticket) {
      responseData.ticket = {
        _id: ticket._id,
        name: ticket.attendeeName,
        email: ticket.attendeeEmail,
      };

      // Prevent duplicate check-in unless allowed
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
          { status: 200 }
        );
      }

      // Update ticket check-in status and increment count
      await Ticket.updateOne(
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
        }
      )

      // Log the check-in in the CheckIn collection
      await CheckIn.create({
        ticketId: ticket._id,
        eventId: eventId,
        attendeeName: ticket.attendeeName,
        attendeeEmail: ticket.attendeeEmail,
        checkedInAt: now,
        checkedInBy: session.user.id,
        checkedInByName: session.user.name,
        method: "web",
        isDuplicate: ticket.isCheckedIn ? true : false,
      })

      // Set response status/message based on duplicate or first check-in
      if (ticket.isCheckedIn) {
        responseData.status = "duplicate_check_in";
        responseData.message = "This ticket has been checked in again";
        responseData.checkInCount = (ticket.checkInCount || 1) + 1;
      } else {
        responseData.status = "first_check_in";
        responseData.checkInCount = 1;
      }

      responseData.checkedInAt = now
    }
    // Handle attendee check-in
    else if (attendee) {
      // Extract name/email from formData or fallback fields
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

      // Prevent duplicate check-in unless allowed
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
          { status: 200 }
        )
      }

      // Update attendee check-in status and increment count
      await FormSubmission.updateOne(
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
        }
      )

      // Log the check-in in the CheckIn collection
      await CheckIn.create({
        submissionId: attendee._id,
        eventId: eventId,
        attendeeName: name,
        attendeeEmail: email,
        checkedInAt: now,
        checkedInBy: session.user.id,
        checkedInByName: session.user.name,
        method: "web",
        isDuplicate: attendee.isCheckedIn ? true : false,
      })

      // Set response status/message based on duplicate or first check-in
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
      { status: 500 }
    );
  }
}