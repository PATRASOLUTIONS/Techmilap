import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { handleFormSubmission } from "@/lib/form-submission"
import { ObjectId } from "mongodb"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  console.log(`Received public registration for event ${params.id}`)

  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase()
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

    const { firstName, lastName, email, corporateEmail, userEmail, ...additionalInfo } = body || {}

    // Use email consistently - prioritize the main email field but fall back to corporateEmail or userEmail if provided
    const finalEmail = email || corporateEmail || userEmail || ""

    if (!firstName || !lastName || !finalEmail) {
      console.error("Missing required fields: firstName, lastName, or email")
      return NextResponse.json({ error: "First Name, Last Name, and email are required" }, { status: 400 })
    }

    // Verify that the event exists before proceeding
    let eventObjectId
    try {
      eventObjectId = new ObjectId(params.id)
    } catch (error) {
      // If not a valid ObjectId, try to find by slug
      const event = await db.collection("events").findOne({ slug: params.id })
      if (!event) {
        console.error("Event not found with slug:", params.id)
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }
      eventObjectId = event._id
    }

    // Check if the event exists
    const event = await db.collection("events").findOne({ _id: eventObjectId })
    if (!event) {
      console.error("Event not found with ID:", params.id)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    try {
      // Create a direct submission to the database as a fallback
      if (!event.useCustomForms) {
        const submission = {
          eventId: eventObjectId,
          userId: null,
          userName: `${firstName} ${lastName}`.trim(),
          userEmail: finalEmail, // Use the consistent email
          formType: "attendee",
          status: "pending", // Set to pending instead of approved
          data: {
            firstName,
            lastName,
            email: finalEmail, // Store consistent email in data
            ...additionalInfo,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const result = await db.collection("formsubmissions").insertOne(submission)
        console.log("Direct submission saved with ID:", result.insertedId)

        // Send confirmation email to the user
        await sendConfirmationEmail(event, finalEmail, `${firstName} ${lastName}`.trim())

        return NextResponse.json({
          success: true,
          message: "Registration submitted and pending approval",
          registrationId: result.insertedId.toString(),
        })
      }

      // Use the handleFormSubmission helper if available
      // Make sure to pass the status as pending and consistent email
      const submissionResult = await handleFormSubmission(
        params.id,
        "attendee",
        {
          firstName,
          lastName,
          email: finalEmail, // Use consistent email
          userEmail: finalEmail, // Also set userEmail to be consistent
          ...additionalInfo,
          status: "pending",
        },
        null, // No user ID for public submissions
      )

      console.log("handleFormSubmission result:", submissionResult)

      return NextResponse.json({
        success: submissionResult.success,
        message: "Registration submitted and pending approval",
        registrationId: submissionResult.submissionId,
      })
    } catch (submissionError: any) {
      console.error("Error in form submission:", submissionError)

      // Attempt direct database insertion as a fallback
      try {
        const submission = {
          eventId: eventObjectId,
          userId: null,
          userName: `${firstName} ${lastName}`.trim(),
          userEmail: finalEmail, // Use consistent email
          formType: "attendee",
          status: "pending", // Set to pending instead of approved
          data: {
            firstName,
            lastName,
            email: finalEmail, // Store consistent email in data
            ...additionalInfo,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const result = await db.collection("formsubmissions").insertOne(submission)
        console.log("Fallback submission saved with ID:", result.insertedId)

        // Send confirmation email to the user
        await sendConfirmationEmail(event, finalEmail, `${firstName} ${lastName}`.trim())

        return NextResponse.json({
          success: true,
          message: "Registration submitted and pending approval (fallback method)",
          registrationId: result.insertedId.toString(),
        })
      } catch (fallbackError: any) {
        console.error("Fallback submission also failed:", fallbackError)
        return NextResponse.json(
          {
            error: "Form submission failed",
            details: submissionError.message || "Unknown submission error",
          },
          { status: 500 },
        )
      }
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

// Helper function to send confirmation email
async function sendConfirmationEmail(event: any, email: string, name: string) {
  try {
    const subject = `Your registration for ${event.title} has been received`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #4f46e5;">Registration Received</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering for <strong>"${event.title}"</strong>.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Event Details</h3>
          <p><strong>Event:</strong> ${event.title}</p>
          <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
          <p><strong>Location:</strong> ${event.location || "TBD"}</p>
        </div>
        
        <p>Your registration is currently under review. We will notify you once it has been approved.</p>
        
        <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
          Best regards,<br>
          The Tech Milap Team
        </p>
      </div>
    `

    const text = `
      Hello ${name},
      
      Thank you for registering for "${event.title}".
      
      Event Details:
      - Event: ${event.title}
      - Date: ${new Date(event.date).toLocaleDateString()}
      - Location: ${event.location || "TBD"}
      
      Your registration is currently under review. We will notify you once it has been approved.
      
      Best regards,
      The Tech Milap Team
    `

    // Use the email service to send the email
    await fetch(`/api/events/${event._id}/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: email,
        subject,
        html,
        text,
      }),
    })

    console.log(`Confirmation email sent to: ${email}`)
    return true
  } catch (error) {
    console.error("Error sending confirmation email:", error)
    return false
  }
}
