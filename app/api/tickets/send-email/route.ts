import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Ticket from "@/models/Ticket"
import Event from "@/models/Event"
import User from "@/models/User"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { sendTemplatedEmail } from "@/lib/email-template-service"
import FormSubmission from "@/models/FormSubmission"
import { extractNameFromFormData, extractEmailFromFormData } from "@/lib/ticket-utils"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const { ticketId, ticketType, formType } = await req.json()

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    console.log(`Processing email request for ticket: ${ticketId}, type: ${ticketType || formType || "unknown"}`)

    // Check if this is a form submission ticket or a regular ticket
    let ticket, event, attendeeName, attendeeEmail, formData

    if (ticketType === "submission" || formType) {
      // This is a form submission ticket
      console.log(`Looking for form submission with ID: ${ticketId}`)
      const submission = await FormSubmission.findById(ticketId)

      if (!submission) {
        console.error(`Form submission not found for ID: ${ticketId}`)
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
      }

      console.log(`Found form submission: ${submission._id}`)
      ticket = submission

      // Get the event separately instead of using populate
      event = await Event.findById(submission.eventId)

      if (!event) {
        console.error(`Event not found for submission: ${ticketId}`)
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }

      formData = submission.formData || {}

      // Extract name and email from form data
      attendeeName = extractNameFromFormData(formData, submission)
      attendeeEmail = extractEmailFromFormData(formData, submission)

      console.log(`Extracted name: ${attendeeName}, email: ${attendeeEmail}`)
    } else {
      // This is a regular ticket
      console.log(`Looking for ticket with ID: ${ticketId}`)
      ticket = await Ticket.findById(ticketId)

      if (!ticket) {
        console.error(`Ticket not found for ID: ${ticketId}`)
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
      }

      console.log(`Found ticket: ${ticket._id}`)

      // Find the event
      event = await Event.findById(ticket.event)

      // Get attendee information from the ticket
      attendeeName = ticket.attendeeName || "Attendee"
      attendeeEmail = ticket.attendeeEmail || ""
      formData = ticket.formData || {}

      console.log(`Ticket attendee name: ${attendeeName}, email: ${attendeeEmail}`)
    }

    if (!event) {
      console.error(`Event not found for ticket: ${ticketId}`)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log(`Found event: ${event.title} (${event._id})`)

    // Check if user has permission to send email for this ticket
    // For form submissions, check if the user is the event organizer or the ticket owner
    const isOrganizer = event.organizer && event.organizer.toString() === session.user.id
    const isTicketOwner = ticket.userId && ticket.userId.toString() === session.user.id

    if (session.user.role !== "super-admin" && !isOrganizer && !isTicketOwner) {
      console.error(`User ${session.user.id} doesn't have permission to send email for ticket ${ticketId}`)
      return NextResponse.json({ error: "You don't have permission to send emails for this event" }, { status: 403 })
    }

    if (!attendeeEmail) {
      console.error(`Could not find attendee email in ticket data for ticket ${ticketId}`)
      return NextResponse.json({ error: "Could not find attendee email in ticket data" }, { status: 400 })
    }

    // Get the event organizer
    const organizer = await User.findById(event.organizer)
    if (!organizer) {
      console.error(`Event organizer not found for event ${event._id}`)
      return NextResponse.json({ error: "Event organizer not found" }, { status: 404 })
    }

    console.log(`Found organizer: ${organizer.name} (${organizer._id})`)

    // Generate ticket URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const ticketUrl = `${appUrl}/tickets/${ticket._id}`

    // Prepare variables for the email template
    const variables = {
      attendeeName,
      eventName: event.title,
      eventDate: new Date(event.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Tokyo", // Use Tokyo timezone to prevent date shift
      }),
      eventTime: `${event.startTime || "00:00"} - ${event.endTime || "00:00"}`,
      eventLocation: event.location || "TBD",
      ticketId: ticket.ticketNumber || ticket._id.toString().substring(0, 8).toUpperCase(),
      ticketUrl,
      organizerName: organizer.name || "Event Organizer",
    }

    console.log(`Sending ticket email to ${attendeeEmail} for event ${event.title}`)
    console.log(`Email variables:`, variables)

    try {
      // Send the email using the template
      const result = await sendTemplatedEmail({
        userId: event.organizer.toString(),
        templateType: "ticket",
        recipientEmail: attendeeEmail,
        recipientName: attendeeName,
        eventId: event._id.toString(),
        variables,
        customSubject: `Your Ticket for ${event.title}`,
      })

      if (result) {
        console.log(`Successfully sent ticket email to ${attendeeEmail}`)
        return NextResponse.json({ success: true, message: "Ticket email sent successfully" })
      } else {
        console.error(`Failed to send ticket email to ${attendeeEmail}`)
        return NextResponse.json({ error: "Failed to send ticket email" }, { status: 500 })
      }
    } catch (emailError) {
      console.error("Error in sendTemplatedEmail:", emailError)
      return NextResponse.json(
        {
          error: "Failed to send email",
          details: emailError.message || "Unknown error in email sending process",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error sending ticket email:", error)
    return NextResponse.json(
      {
        error: "An error occurred while sending the ticket email",
        details: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
