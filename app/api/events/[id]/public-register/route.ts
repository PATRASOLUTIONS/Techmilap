import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendFormSubmissionNotification } from "@/lib/email-service"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  console.log(`Received public registration for event ${params.id}`)

  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase()
    console.log("Connected to database")

    // Get the request body with careful error handling
    let body
    try {
      // Get the raw text first to debug any issues
      const rawText = await req.text()
      console.log("Raw request body:", rawText)

      // Try to parse as JSON
      try {
        body = JSON.parse(rawText)
        console.log("Parsed request body:", body)
      } catch (jsonError) {
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
    } catch (parseError) {
      console.error("Error reading request body:", parseError)
      return NextResponse.json({ error: "Could not read request body" }, { status: 400 })
    }

    const { name, email, additionalInfo } = body || {}

    if (!name || !email) {
      console.error("Missing required fields: name or email")
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Convert string ID to ObjectId if possible
    let eventId
    try {
      eventId = new ObjectId(params.id)
      console.log("Converted event ID to ObjectId:", eventId)
    } catch (error) {
      // If not a valid ObjectId, try to find by slug
      console.log("Event ID is not a valid ObjectId, trying to find by slug")
      const event = await db.collection("events").findOne({ slug: params.id })
      if (!event) {
        console.error("Event not found with slug:", params.id)
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }
      eventId = event._id
      console.log("Found event by slug, using ID:", eventId)
    }

    // Find the event
    const event = await db.collection("events").findOne({ _id: eventId })

    if (!event) {
      console.error("Event not found with ID:", eventId)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    console.log("Found event:", event.title)

    // Check if registration is already closed
    if (event.registrationClosed) {
      console.log("Registration is closed for this event")
      return NextResponse.json({ error: "Registration for this event is closed" }, { status: 400 })
    }

    // Check if the user is already registered
    const existingRegistration = await db.collection("formsubmissions").findOne({
      eventId: eventId,
      formType: "attendee",
      "data.email": email,
    })

    if (existingRegistration) {
      console.log("User is already registered for this event")
      return NextResponse.json({ error: "You are already registered for this event" }, { status: 400 })
    }

    // Create the submission with sanitized data
    const submission = {
      eventId: eventId,
      userId: null, // Public registration, no user ID
      formType: "attendee",
      status: "approved", // Auto-approve public registrations
      data: {
        name,
        email,
        ...(additionalInfo || {}),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("Creating submission:", JSON.stringify(submission, null, 2))

    // Insert the submission
    try {
      const result = await db.collection("formsubmissions").insertOne(submission)
      console.log("Submission saved to database with ID:", result.insertedId)

      if (!result.acknowledged) {
        console.error("Database did not acknowledge the insertion")
        throw new Error("Failed to save submission to database")
      }

      // Get organizer information
      const organizer = await db.collection("users").findOne({ _id: new ObjectId(event.organizer) })

      if (organizer) {
        try {
          // Send email notifications
          await sendFormSubmissionNotification(
            event.title,
            "attendee",
            email,
            name,
            organizer.email,
            organizer.name || `${organizer.firstName || ""} ${organizer.lastName || ""}`.trim(),
          )
          console.log("Email notification sent")
        } catch (emailError) {
          console.error("Error sending registration notification:", emailError)
          // Continue with the response even if email fails
        }
      } else {
        console.warn("No organizer found for event, skipping notification")
      }

      return NextResponse.json({
        success: true,
        message: "Registration successful",
        registrationId: result.insertedId,
      })
    } catch (dbError) {
      console.error("Database error while saving submission:", dbError)
      return NextResponse.json(
        {
          error: "Database error while saving submission",
          details: dbError.message || "Unknown database error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
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
