import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendTicketEmail } from "@/lib/email-service"
import { generateTicketUrl, extractNameFromFormData, extractEmailFromFormData } from "@/lib/ticket-utils"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { ticketId, ticketType, formType } = await req.json()

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    console.log(
      `Sending email for ticket ${ticketId}, type: ${ticketType || "regular"}, formType: ${formType || "N/A"}`,
    )

    // Connect to database
    const { db } = await connectToDatabase()

    let ticketData
    let eventData

    // Handle form submission tickets
    if (ticketType === "submission") {
      // Get form submission data
      const submission = await db.collection("formsubmissions").findOne({
        _id: new ObjectId(ticketId),
        userId: userId,
      })

      if (!submission) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 })
      }

      // Get event data
      eventData = await db.collection("events").findOne({
        _id: new ObjectId(submission.eventId),
      })

      if (!eventData) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }

      // Get organizer data
      let organizerData = null
      if (eventData.organizerId) {
        organizerData = await db.collection("users").findOne({
          _id: new ObjectId(eventData.organizerId),
        })
      }

      // Extract attendee information
      const formData = submission.data || {}
      const attendeeName = extractNameFromFormData(formData, submission)
      const attendeeEmail = extractEmailFromFormData(formData, submission)

      if (!attendeeEmail) {
        return NextResponse.json({ error: "No email address found for this ticket" }, { status: 400 })
      }

      // Generate ticket URL
      const ticketUrl = generateTicketUrl(ticketId)

      // Prepare event details for email
      const enhancedEventDetails = {
        ...eventData,
        organizer: eventData.organizerId,
        organizerName: organizerData?.name || "Event Organizer",
      }

      // Send ticket email
      const emailSent = await sendTicketEmail({
        eventName: eventData.title,
        attendeeEmail,
        attendeeName,
        ticketId,
        ticketUrl,
        eventDetails: enhancedEventDetails,
        eventId: eventData._id.toString(),
      })

      return NextResponse.json({
        success: true,
        emailSent,
        message: emailSent ? "Ticket email sent successfully" : "Failed to send ticket email",
      })
    } else {
      // Handle regular tickets
      const ticket = await db.collection("tickets").findOne({
        _id: new ObjectId(ticketId),
        userId: userId,
      })

      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
      }

      // Get event data
      eventData = await db.collection("events").findOne({
        _id: new ObjectId(ticket.event),
      })

      if (!eventData) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }

      // Get organizer data
      let organizerData = null
      if (eventData.organizerId) {
        organizerData = await db.collection("users").findOne({
          _id: new ObjectId(eventData.organizerId),
        })
      }

      // Generate ticket URL
      const ticketUrl = generateTicketUrl(ticketId)

      // Prepare event details for email
      const enhancedEventDetails = {
        ...eventData,
        organizer: eventData.organizerId,
        organizerName: organizerData?.name || "Event Organizer",
      }

      // Send ticket email
      const emailSent = await sendTicketEmail({
        eventName: eventData.title,
        attendeeEmail: ticket.email || session.user.email,
        attendeeName: ticket.name || session.user.name || "Attendee",
        ticketId,
        ticketUrl,
        eventDetails: enhancedEventDetails,
        eventId: eventData._id.toString(),
      })

      return NextResponse.json({
        success: true,
        emailSent,
        message: emailSent ? "Ticket email sent successfully" : "Failed to send ticket email",
      })
    }
  } catch (error) {
    console.error("Error sending ticket email:", error)
    return NextResponse.json({ error: "Failed to send ticket email" }, { status: 500 })
  }
}
