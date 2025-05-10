import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Ticket from "@/models/Ticket"
import Event from "@/models/Event"
import User from "@/models/User"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { sendTemplatedEmail } from "@/lib/email-template-service"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const { ticketId } = await req.json()

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    // Find the ticket
    const ticket = await Ticket.findById(ticketId)
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Find the event
    const event = await Event.findById(ticket.event)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user has permission to send email for this ticket
    if (session.user.role !== "super-admin" && event.organizer.toString() !== session.user.id) {
      return NextResponse.json({ error: "You don't have permission to send emails for this event" }, { status: 403 })
    }

    // Get attendee information from the ticket
    let attendeeName = "Attendee"
    let attendeeEmail = ""

    if (ticket.isFormSubmission && ticket.formData) {
      // Try to extract name from form data
      const formData = ticket.formData

      // Look for name fields with various patterns
      const nameFields = ["name", "fullName", "attendeeName", "firstName"]

      // Also check for question_name_* pattern
      const questionNameField = Object.keys(formData).find(
        (key) => key.startsWith("question_name_") || key.startsWith("question_fullName_"),
      )

      if (questionNameField) {
        attendeeName = formData[questionNameField]
      } else {
        // Try standard name fields
        for (const field of nameFields) {
          if (formData[field]) {
            attendeeName = formData[field]
            break
          }
        }

        // If we have firstName and lastName, combine them
        if (formData.firstName && formData.lastName) {
          attendeeName = `${formData.firstName} ${formData.lastName}`
        }
      }

      // Look for email fields with various patterns
      const emailFields = ["email", "emailAddress", "attendeeEmail"]

      // Also check for question_email_* pattern
      const questionEmailField = Object.keys(formData).find(
        (key) => key.startsWith("question_email_") || key.startsWith("question_emailAddress_"),
      )

      if (questionEmailField) {
        attendeeEmail = formData[questionEmailField]
      } else {
        // Try standard email fields
        for (const field of emailFields) {
          if (formData[field]) {
            attendeeEmail = formData[field]
            break
          }
        }
      }
    }

    if (!attendeeEmail) {
      return NextResponse.json({ error: "Could not find attendee email in ticket data" }, { status: 400 })
    }

    // Get the event organizer
    const organizer = await User.findById(event.organizer)
    if (!organizer) {
      return NextResponse.json({ error: "Event organizer not found" }, { status: 404 })
    }

    // Generate ticket URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const ticketUrl = `${appUrl}/tickets/${ticket._id}`

    // Prepare variables for the email template
    const variables = {
      attendeeName,
      eventName: event.title,
      eventDate: new Date(event.date).toLocaleDateString(),
      eventTime: `${event.startTime} - ${event.endTime}`,
      eventLocation: event.location || "TBD",
      ticketId: ticket.ticketNumber || ticket._id.toString().substring(0, 8).toUpperCase(),
      ticketUrl,
      organizerName: organizer.name || "Event Organizer",
    }

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
      return NextResponse.json({ success: true, message: "Ticket email sent successfully" })
    } else {
      return NextResponse.json({ error: "Failed to send ticket email" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error sending ticket email:", error)
    return NextResponse.json({ error: "An error occurred while sending the ticket email" }, { status: 500 })
  }
}
