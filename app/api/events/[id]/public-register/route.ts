import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"
import { sendEmail } from "@/lib/email-service"
import { rateLimit } from "@/lib/rate-limit"

// Create a rate limiter for registrations
const registrationRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 5, // 5 registrations per minute per IP
})

// Define a more flexible validation schema that doesn't require specific fields
const FlexibleRegistrationSchema = z.object({}).catchall(z.any())

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  console.log(`Received public registration for event ${params.id}`)

  // Get the request body with careful error handling
  let body
  try {
    // Read the request body once and store it
    const rawText = await req.text()

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
        },
        { status: 400 },
      )
    }
  } catch (parseError: any) {
    console.error("Error reading request body:", parseError)
    return NextResponse.json({ error: "Could not read request body" }, { status: 400 })
  }

  // Add this near the top of the POST function
  console.log("Received registration data:", body)

  try {
    // Apply rate limiting based on IP
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    try {
      await registrationRateLimiter.check(1, ip)
    } catch (error) {
      console.error(`Rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        {
          error: "Too many registration attempts. Please try again later.",
        },
        { status: 429 },
      )
    }

    // Connect to MongoDB
    let db
    try {
      const dbConnection = await connectToDatabase()
      db = dbConnection.db
      console.log("Connected to database")
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: "Unable to connect to the database. Please try again later.",
        },
        { status: 503 },
      )
    }

    // Use the flexible schema that accepts any fields
    const validationResult = FlexibleRegistrationSchema.safeParse(body)
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.format())
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationResult.error.format(),
          message: "Please check your form inputs and try again.",
        },
        { status: 400 },
      )
    }

    const validatedData = validationResult.data

    // Extract name and email from any field that might contain them
    let finalName = ""
    let finalEmail = ""

    // Look for email in any field that might contain it
    const emailFields = ["email", "corporateEmail", "userEmail", "emailAddress", "mail"]
    for (const field of emailFields) {
      if (validatedData[field] && typeof validatedData[field] === "string" && validatedData[field].includes("@")) {
        finalEmail = validatedData[field]
        console.log(`Found email in field ${field}: ${finalEmail}`)
        break
      }
    }

    // If no standard email field, look for any field that might contain an email
    if (!finalEmail) {
      for (const key in validatedData) {
        if (
          validatedData[key] &&
          typeof validatedData[key] === "string" &&
          validatedData[key].includes("@") &&
          validatedData[key].includes(".")
        ) {
          finalEmail = validatedData[key]
          console.log(`Found email in non-standard field ${key}: ${finalEmail}`)
          break
        }
      }
    }

    // Look for name in any field that might contain it
    if (validatedData.name) {
      finalName = validatedData.name
    } else if (validatedData.fullName) {
      finalName = validatedData.fullName
    } else if (validatedData.firstName) {
      finalName = validatedData.firstName
      if (validatedData.lastName) {
        finalName += " " + validatedData.lastName
      }
    } else {
      // Try to find any field that might contain a name
      const possibleNameFields = Object.keys(validatedData).filter(
        (key) =>
          key.toLowerCase().includes("name") && typeof validatedData[key] === "string" && validatedData[key].length > 0,
      )

      if (possibleNameFields.length > 0) {
        finalName = validatedData[possibleNameFields[0]]
      }
    }

    // If we still don't have a name or email, use a default
    if (!finalName) finalName = "Attendee"

    // Accept any email, even if it's a placeholder
    if (!finalEmail && validatedData.email) {
      finalEmail = validatedData.email
      console.log(`Using provided email field: ${finalEmail}`)
    }

    // If still no email, create a placeholder
    if (!finalEmail) {
      // Create a placeholder email using the name if available
      if (finalName && finalName !== "Attendee") {
        finalEmail = `${finalName.replace(/\s+/g, ".").toLowerCase()}@example.com`
      } else {
        finalEmail = `attendee.${Date.now()}@example.com`
      }
      console.log(`Created placeholder email: ${finalEmail}`)
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

    // Check if event has reached capacity
    if (event.capacity > 0) {
      const currentAttendees = await db.collection("formsubmissions").countDocuments({
        eventId: eventObjectId,
        formType: "attendee",
        status: { $in: ["approved", "pending"] },
      })

      if (currentAttendees >= event.capacity) {
        return NextResponse.json({ error: "This event has reached its capacity" }, { status: 409 })
      }
    }

    try {
      // Create a direct submission to the database
      const submission = {
        eventId: eventObjectId,
        userId: null,
        userName: finalName,
        userEmail: finalEmail,
        formType: "attendee",
        status: "pending",
        data: {
          ...validatedData,
          name: finalName,
          email: finalEmail,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await db.collection("formsubmissions").insertOne(submission)
      console.log("Direct submission saved with ID:", result.insertedId)

      // Send confirmation email to the user
      await sendConfirmationEmail(event, finalEmail, finalName)

      return NextResponse.json({
        success: true,
        message: "Registration submitted and pending approval",
        registrationId: result.insertedId.toString(),
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
    await sendEmail({
      to: email,
      subject,
      html,
      text,
    })

    console.log(`Confirmation email sent to: ${email}`)
    return true
  } catch (error) {
    console.error("Error sending confirmation email:", error)
    return false
  }
}
