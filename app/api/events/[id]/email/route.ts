import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const eventId = params.id

    // Verify the user has permission to access this event
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
      userId: session.user.id,
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 })
    }

    const { registrationIds, subject, message, includeEventDetails } = await request.json()

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ error: "No recipients specified" }, { status: 400 })
    }

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 })
    }

    // Get the registrations
    const registrations = await db
      .collection("formSubmissions")
      .find({
        _id: { $in: registrationIds.map((id) => new ObjectId(id)) },
        eventId: eventId,
        formType: "attendee",
      })
      .toArray()

    if (registrations.length === 0) {
      return NextResponse.json({ error: "No valid registrations found" }, { status: 404 })
    }

    // Send emails to each recipient
    const emailPromises = registrations.map(async (registration) => {
      const attendeeEmail = registration.data?.email
      const attendeeName = registration.data?.name || registration.data?.firstName || "Attendee"

      if (!attendeeEmail) {
        return { id: registration._id, success: false, error: "No email address found" }
      }

      // Prepare event details section if requested
      let eventDetailsHtml = ""
      let eventDetailsText = ""

      if (includeEventDetails) {
        const eventDate = event.startDate ? new Date(event.startDate).toLocaleDateString() : "TBD"
        const eventTime = event.startTime || "TBD"
        const eventLocation = event.location || "TBD"

        eventDetailsHtml = `
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Event Details</h3>
            <p><strong>Event:</strong> ${event.title}</p>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Time:</strong> ${eventTime}</p>
            <p><strong>Location:</strong> ${eventLocation}</p>
          </div>
        `

        eventDetailsText = `
Event Details:
- Event: ${event.title}
- Date: ${eventDate}
- Time: ${eventTime}
- Location: ${eventLocation}
        `
      }

      // Personalize the message with the attendee's name
      const personalizedHtml = message.replace(/\{name\}/g, attendeeName)
      const personalizedText = message.replace(/\{name\}/g, attendeeName)

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          ${personalizedHtml}
          ${eventDetailsHtml}
          <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px; border-top: 1px solid #eaeaea; padding-top: 20px;">
            This email was sent by the organizer of ${event.title}.
          </p>
        </div>
      `

      const text = `${personalizedText}
      
${eventDetailsText}

This email was sent by the organizer of ${event.title}.`

      try {
        const result = await sendEmail({
          to: attendeeEmail,
          subject,
          text,
          html,
        })

        return { id: registration._id, success: result, email: attendeeEmail }
      } catch (error) {
        console.error(`Error sending email to ${attendeeEmail}:`, error)
        return { id: registration._id, success: false, email: attendeeEmail, error: error.message }
      }
    })

    const results = await Promise.all(emailPromises)
    const successCount = results.filter((r) => r.success).length

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} of ${registrations.length} emails successfully`,
      results,
    })
  } catch (error) {
    console.error("Error sending emails:", error)
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 })
  }
}
