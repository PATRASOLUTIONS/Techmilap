import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { sendFormSubmissionNotification } from "@/lib/email-service"

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
