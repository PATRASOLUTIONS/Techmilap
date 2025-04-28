import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { sendFormSubmissionNotification, sendEmail } from "@/lib/email-service"

// Import models
const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
const User = mongoose.models.User || mongoose.model("User", require("@/models/User").default.schema)
const FormSubmission =
  mongoose.models.FormSubmission ||
  mongoose.model(
    "FormSubmission",
    new mongoose.Schema({
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: String,
      userEmail: String,
      formType: { type: String, required: true, enum: ["attendee", "volunteer", "speaker"] },
      status: { type: String, default: "pending", enum: ["pending", "approved", "rejected"] },
      data: { type: mongoose.Schema.Types.Mixed, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }),
  )

// Email styles for confirmation emails
const emailStyles = {
  container: `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 30px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background-color: #ffffff;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  `,
  header: `
    text-align: center;
    padding-bottom: 20px;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 25px;
  `,
  logo: `
    font-size: 24px;
    font-weight: bold;
    color: #4f46e5;
    text-decoration: none;
  `,
  title: `
    color: #111827;
    font-size: 22px;
    font-weight: 600;
    margin-top: 0;
    margin-bottom: 20px;
  `,
  content: `
    color: #374151;
    font-size: 16px;
    line-height: 1.6;
  `,
  infoBox: `
    background-color: #f9fafb;
    padding: 20px;
    border-radius: 6px;
    margin: 25px 0;
    border-left: 4px solid #4f46e5;
  `,
  footer: `
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
    color: #6b7280;
    font-size: 14px;
  `,
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  console.log(`Received public registration for event ${params.id}`)

  try {
    await connectToDatabase()
    console.log("Connected to database")

    // Get the request body with careful error handling
    let body
    try {
      // Read the request body once and store it
      const rawText = await req.text()
      console.log("Raw request body:", rawText)

      // Try to parse as JSON
      try {
        body = JSON.parse(rawText)
        console.log("Parsed request body:", body)
      } catch (jsonError: any) {
        console.error("JSON parse error:", jsonError)
        return NextResponse.json(
          {
            error: "Invalid JSON in request body",
            details: jsonError.message,
            rawBody: rawText.substring(0, 200) + (rawText.length > 200 ? "..." : ""),
          },
          { status: 400 },
        )
      }
    } catch (parseError: any) {
      console.error("Error reading request body:", parseError)
      return NextResponse.json({ error: "Could not read request body" }, { status: 400 })
    }

    const { firstName, lastName, email, ...additionalInfo } = body || {}

    if (!firstName || !lastName || !email) {
      console.error("Missing required fields: firstName, lastName, or email")
      return NextResponse.json({ error: "First Name, Last Name, and email are required" }, { status: 400 })
    }

    // Verify that the event exists before proceeding
    let eventObjectId
    try {
      eventObjectId = new mongoose.Types.ObjectId(params.id)
    } catch (error) {
      // If not a valid ObjectId, try to find by slug
      const event = await Event.findOne({ slug: params.id })
      if (!event) {
        console.error("Event not found with slug:", params.id)
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }
      eventObjectId = event._id
    }

    // Check if the event exists
    const event = await Event.findOne({ _id: eventObjectId })
    if (!event) {
      console.error("Event not found with ID:", params.id)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    try {
      // Create a name field from firstName and lastName
      const name = `${firstName} ${lastName}`.trim()

      // Create a new form submission for the attendee
      const formSubmission = new FormSubmission({
        eventId: event._id,
        formType: "attendee",
        status: "pending", // Always set to pending initially
        userName: name,
        userEmail: email,
        data: {
          ...body,
          name, // Add the combined name field
        },
      })

      await formSubmission.save()
      console.log("Form submission saved with ID:", formSubmission._id)

      // Add the registration to the event's registrations array
      // But set the status to pending
      if (!event.registrations) {
        event.registrations = []
      }

      event.registrations.push({
        name,
        email,
        status: "pending", // Set to pending initially
        registeredAt: new Date(),
        formSubmissionId: formSubmission._id,
      })

      await event.save()
      console.log("Event updated with new registration")

      // Send notification to the event organizer about the new registration
      try {
        const organizer = await User.findById(event.organizer)
        console.log("Found organizer:", organizer ? organizer.email : "Not found")

        if (organizer && organizer.email) {
          console.log("Sending notification to organizer:", organizer.email)

          const notificationSent = await sendFormSubmissionNotification({
            eventName: event.title,
            formType: "attendee",
            submissionData: body,
            recipientEmail: organizer.email,
            recipientName: organizer.firstName,
            eventId: event._id.toString(),
            submissionId: formSubmission._id.toString(),
          })

          console.log("Notification sent to organizer:", notificationSent)
        } else {
          console.error("Organizer not found or has no email:", event.organizer)
        }
      } catch (notificationError) {
        console.error("Error sending notification to organizer:", notificationError)
        // Don't fail the registration if notification fails
      }

      // Send confirmation email to the attendee
      try {
        console.log("Sending confirmation email to attendee:", email)

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const eventUrl = `${appUrl}/events/${event._id}`

        const subject = `Registration Received: ${event.title}`
        const text = `
          Hello ${name},
          
          Thank you for registering for "${event.title}".
          
          Your registration has been received and is pending approval by the event organizer.
          You will be notified once your registration has been reviewed.
          
          Event Details: ${eventUrl}
          
          Thank you for using TechMilap!
          
          Best regards,
          The TechMilap Team
        `

        const html = `
          <div style="${emailStyles.container}">
            <div style="${emailStyles.header}">
              <div style="${emailStyles.logo}">TechMilap</div>
            </div>
            
            <h1 style="${emailStyles.title}">Registration Received</h1>
            
            <div style="${emailStyles.content}">
              <p>Hello ${name},</p>
              <p>Thank you for registering for <strong>"${event.title}"</strong>.</p>
              
              <div style="${emailStyles.infoBox}">
                <p>Your registration has been received and is pending approval by the event organizer.</p>
                <p>You will be notified once your registration has been reviewed.</p>
              </div>
              
              <p><a href="${eventUrl}" style="color: #4f46e5; text-decoration: underline;">View Event Details</a></p>
            </div>
            
            <div style="${emailStyles.footer}">
              <p>Best regards,<br>The TechMilap Team</p>
            </div>
          </div>
        `

        const confirmationSent = await sendEmail({ to: email, subject, text, html })
        console.log("Confirmation sent to attendee:", confirmationSent)
      } catch (confirmationError) {
        console.error("Error sending confirmation to attendee:", confirmationError)
        // Don't fail the registration if confirmation fails
      }

      return NextResponse.json({
        success: true,
        message: "Registration submitted successfully and pending approval",
      })
    } catch (submissionError: any) {
      console.error("Error in form submission:", submissionError)
      return NextResponse.json(
        {
          error: "Form submission failed",
          details: submissionError.message || "Unknown submission error",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error registering for event:", error)
    return NextResponse.json(
      {
        error: "An error occurred while registering for the event",
        details: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
