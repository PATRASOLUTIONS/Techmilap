import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email-service"

// Import models
const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
const FormSubmission =
  mongoose.models.FormSubmission ||
  mongoose.model(
    "FormSubmission",
    new mongoose.Schema({
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: { type: String },
      userEmail: { type: String },
      formType: { type: String, required: true, enum: ["attendee", "volunteer", "speaker"] },
      status: { type: String, default: "pending", enum: ["pending", "approved", "rejected"] },
      data: { type: mongoose.Schema.Types.Mixed, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }),
  )

export async function GET(req: NextRequest, { params }: { params: { id: string; formType: string } }) {
  try {
    const { db } = await connectToDatabase()
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get submissions for this event and form type
    const submissions = await db
      .collection("formsubmissions")
      .find({
        eventId: new ObjectId(params.id),
        formType: params.formType,
      })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      submissions,
    })
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred while fetching submissions" },
      { status: 500 },
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; formType: string } },
): Promise<NextResponse> {
  try {
    const { db } = await connectToDatabase()
    const session = await getServerSession(authOptions)
    const { data, userId, status, emailSubject } = await req.json()

    // Validate required parameters
    if (!params.id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    if (!params.formType) {
      return NextResponse.json({ error: "Form type is required" }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ error: "Form data is required" }, { status: 400 })
    }

    // Find the event by ID or slug
    let event
    try {
      const objectId = new ObjectId(params.id)
      event = await db.collection("events").findOne({ _id: objectId })
    } catch (error) {
      // If not a valid ObjectId, try to find by slug
      event = await db.collection("events").findOne({ slug: params.id })
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Extract email from form data
    let email = ""

    // First check standard email fields
    if (data.email) {
      email = data.email
    } else {
      // Look for email in custom question fields
      for (const [key, value] of Object.entries(data)) {
        if ((key.includes("email") || key.includes("Email")) && typeof value === "string" && value.includes("@")) {
          email = value
          break
        }
      }
    }

    // Extract name from form data
    let name = ""

    // First check standard name fields
    if (data.name) {
      name = data.name
    } else if (data.firstName || data.lastName) {
      name = `${data.firstName || ""} ${data.lastName || ""}`.trim()
    } else {
      // Look for name in custom question fields
      let firstName = ""
      let lastName = ""
      let fullName = ""

      for (const [key, value] of Object.entries(data)) {
        if (typeof value !== "string") continue

        if ((key.includes("firstName") || key.includes("first_name") || key.includes("FirstName")) && !firstName) {
          firstName = value
        } else if ((key.includes("lastName") || key.includes("last_name") || key.includes("LastName")) && !lastName) {
          lastName = value
        } else if (
          (key.includes("name") || key.includes("Name")) &&
          !key.includes("first") &&
          !key.includes("last") &&
          !fullName
        ) {
          fullName = value
        }
      }

      if (fullName) {
        name = fullName
      } else if (firstName || lastName) {
        name = `${firstName} ${lastName}`.trim()
      }
    }

    // Create the submission document
    const submission = {
      eventId: event._id,
      userId: userId ? new ObjectId(userId) : session?.user?.id ? new ObjectId(session.user.id) : null,
      userName: name || session?.user?.name || "Anonymous",
      userEmail: email || session?.user?.email || null,
      formType: params.formType,
      status: status || "pending",
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Insert the submission
    const result = await db.collection("formsubmissions").insertOne(submission)

    // Send confirmation email to the user if we have their email
    if (email) {
      try {
        await sendConfirmationEmail(event, params.formType, name, email, emailSubject)
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError)
      }
    }

    // Send notification to the event organizer
    try {
      await sendOrganizerNotification(event, params.formType, submission, result.insertedId.toString(), emailSubject)
    } catch (emailError) {
      console.error("Error sending organizer notification:", emailError)
    }

    return NextResponse.json({
      success: true,
      message: `${params.formType} submission received`,
      submissionId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Error handling form submission:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred while processing your submission" },
      { status: 500 },
    )
  }
}

// Function to send confirmation email to the user
async function sendConfirmationEmail(event, formType, userName, userEmail, emailSubject = null) {
  // Format the form type for display
  const formTypeDisplay = formType === "attendee" ? "registration" : `${formType} application`
  const name = userName || "Attendee"

  // Use custom subject if provided, otherwise use default
  const subject = emailSubject || `Your ${formTypeDisplay} for ${event.title} has been received`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #4f46e5;">Submission Received</h2>
      <p>Hello ${name},</p>
      <p>Thank you for your ${formTypeDisplay} for <strong>"${event.title}"</strong>.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Event Details</h3>
        <p><strong>Event:</strong> ${event.title}</p>
        <p><strong>Date:</strong> 10 May 2025</p>
        <p><strong>Location:</strong> ${event.location || "TBD"}</p>
      </div>
      
      <p>Your submission is currently under review. We will notify you once it has been processed.</p>
      
      <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
        Best regards,<br>
        The Event Team
      </p>
    </div>
  `

  const text = `
    Hello ${name},
    
    Thank you for your ${formTypeDisplay} for "${event.title}".
    
    Event Details:
    - Event: ${event.title}
    - Date: 10 May 2025
    - Location: ${event.location || "TBD"}
    
    Your submission is currently under review. We will notify you once it has been processed.
    
    Best regards,
    The Event Team
  `

  await sendEmail({
    to: userEmail,
    subject,
    html,
    text,
  })

  console.log(`Confirmation email sent to user: ${userEmail}`)
  return true
}

// Function to send notification email to the organizer
async function sendOrganizerNotification(event, formType, submission, submissionId, emailSubject = null) {
  // Get organizer email
  let organizerEmail = event.organizerEmail

  // If no direct organizer email, try to get it from the organizer object
  if (!organizerEmail && event.organizer) {
    // Check if organizer is populated or just an ID
    if (typeof event.organizer === "object" && event.organizer !== null) {
      organizerEmail = event.organizer.email
    } else {
      // Try to fetch organizer from database
      const { db } = await connectToDatabase()
      const organizer = await db.collection("users").findOne({ _id: event.organizer })
      if (organizer) {
        organizerEmail = organizer.email
      }
    }
  }

  // If still no organizer email, use a fallback or return
  if (!organizerEmail) {
    console.error("Could not find organizer email for event:", event._id)
    return false
  }

  // Format the form type for display
  const formTypeFormatted = formType.charAt(0).toUpperCase() + formType.slice(1)

  // Create a summary of the submission data
  let submissionSummary = ""
  if (submission.data && typeof submission.data === "object") {
    // Extract key information for the email summary
    for (const [key, value] of Object.entries(submission.data)) {
      if (
        key.toLowerCase().includes("email") ||
        key.toLowerCase().includes("name") ||
        key.toLowerCase().includes("phone") ||
        key.toLowerCase().includes("message") ||
        key.toLowerCase().includes("interest") ||
        key.toLowerCase().includes("availability")
      ) {
        const displayKey = key
          .replace(/^question_/, "")
          .replace(/_\d+$/, "")
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .replace(/^\w/, (c) => c.toUpperCase())

        const displayValue = Array.isArray(value) ? value.join(", ") : String(value)

        submissionSummary += `<p><strong>${displayKey}:</strong> ${displayValue}</p>`
      }
    }
  }

  if (!submissionSummary) {
    submissionSummary = "<p>No detailed information available.</p>"
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const viewSubmissionUrl = `${appUrl}/event-dashboard/${event._id}/${formType}s`

  // Use custom subject if provided, otherwise use default
  const subject = emailSubject || `New ${formTypeFormatted} Submission for ${event.title}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #4f46e5;">New ${formTypeFormatted} Submission</h2>
      <p>Hello Event Organizer,</p>
      <p>You have received a new ${formType} submission for your event <strong>"${event.title}"</strong>.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Submission Summary</h3>
        ${submissionSummary}
      </div>
      
      <p>
        <a href="${viewSubmissionUrl}" style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View All Submissions
        </a>
      </p>
      
      <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
        Thank you for using our platform!
      </p>
    </div>
  `

  const text = `
    Hello Event Organizer,
    
    You have received a new ${formType} submission for your event "${event.title}".
    
    Submission ID: ${submissionId}
    
    To view all submissions, please visit: ${viewSubmissionUrl}
    
    Thank you for using our platform!
  `

  await sendEmail({
    to: organizerEmail,
    subject,
    html,
    text,
  })

  console.log(`Notification email sent to organizer: ${organizerEmail}`)
  return true
}
