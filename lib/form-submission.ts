import mongoose from "mongoose"
import { connectToDatabase } from "@/lib/mongodb"
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

// Function to send confirmation email to the person who submitted the form
async function sendSubmitterConfirmationEmail(
  formType: string,
  eventName: string,
  submitterEmail: string,
  submitterName: string,
  eventId: string,
) {
  console.log(`Sending confirmation email to ${submitterEmail} for ${formType} submission to event ${eventName}`)

  if (!submitterEmail) {
    console.error("Missing submitter email for confirmation email")
    return false
  }

  const formTypeCapitalized = formType.charAt(0).toUpperCase() + formType.slice(1)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const eventUrl = `${appUrl}/events/${eventId}`

  const subject = `${formTypeCapitalized} Submission Received: ${eventName}`
  const text = `
    Hello ${submitterName || "there"},
    
    Thank you for your ${formType} submission for "${eventName}".
    
    Your submission has been received and is pending review by the event organizer.
    You will be notified once your submission has been reviewed.
    
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
      
      <h1 style="${emailStyles.title}">${formTypeCapitalized} Submission Received</h1>
      
      <div style="${emailStyles.content}">
        <p>Hello ${submitterName || "there"},</p>
        <p>Thank you for your ${formType} submission for <strong>"${eventName}"</strong>.</p>
        
        <div style="${emailStyles.infoBox}">
          <p>Your submission has been received and is pending review by the event organizer.</p>
          <p>You will be notified once your submission has been reviewed.</p>
        </div>
        
        <p><a href="${eventUrl}" style="color: #4f46e5; text-decoration: underline;">View Event Details</a></p>
      </div>
      
      <div style="${emailStyles.footer}">
        <p>Best regards,<br>The TechMilap Team</p>
      </div>
    </div>
  `

  return sendEmail({ to: submitterEmail, subject, text, html })
}

export async function handleFormSubmission(
  eventIdOrSlug: string,
  formType: "attendee" | "volunteer" | "speaker",
  formData: any,
  userId?: string | null,
) {
  try {
    console.log(`Handling ${formType} form submission for event ${eventIdOrSlug}`)
    console.log("Form data:", JSON.stringify(formData, null, 2))

    await connectToDatabase()

    // Find the event by ID or slug
    let event
    if (mongoose.isValidObjectId(eventIdOrSlug)) {
      event = await Event.findById(eventIdOrSlug)
    }

    if (!event) {
      event = await Event.findOne({ slug: eventIdOrSlug })
    }

    if (!event) {
      console.error("Event not found:", eventIdOrSlug)
      return { success: false, message: "Event not found" }
    }

    // Check if the form is published
    let formConfig
    if (formType === "attendee") {
      formConfig = event.attendeeForm
    } else if (formType === "volunteer") {
      formConfig = event.volunteerForm
    } else if (formType === "speaker") {
      formConfig = event.speakerForm
    }

    if (!formConfig || formConfig.formSettings?.status !== "published") {
      console.error(`${formType} form is not published for event:`, event._id)
      return { success: false, message: `${formType} form is not available` }
    }

    // Get user details if userId is provided
    let user
    if (userId) {
      user = await User.findById(userId)
      if (!user) {
        console.error("User not found:", userId)
        return { success: false, message: "User not found" }
      }
    }

    // Extract submitter information
    const submitterEmail = formData.email || user?.email
    let submitterName = formData.name

    if (!submitterName) {
      if (formData.firstName && formData.lastName) {
        submitterName = `${formData.firstName} ${formData.lastName}`.trim()
      } else if (user) {
        submitterName = `${user.firstName} ${user.lastName || ""}`.trim()
      }
    }

    console.log("Submitter info:", { submitterEmail, submitterName })

    // Create the form submission
    const submission = new FormSubmission({
      eventId: event._id,
      formType,
      status: "pending", // Always set to pending initially
      userId: user?._id,
      userName: submitterName,
      userEmail: submitterEmail,
      data: {
        ...formData,
        name: submitterName || undefined,
      },
    })

    await submission.save()
    console.log(`${formType} form submission saved with ID:`, submission._id)

    // If it's an attendee submission, also update the event registrations
    if (formType === "attendee") {
      if (!event.registrations) {
        event.registrations = []
      }

      event.registrations.push({
        userId: user?._id,
        name: submitterName,
        email: submitterEmail,
        status: "pending", // Set to pending initially
        registeredAt: new Date(),
        formSubmissionId: submission._id,
      })

      await event.save()
      console.log("Event updated with new registration")
    }

    // Send notification to the event organizer
    try {
      // Fetch the organizer with their email
      const organizer = await User.findById(event.organizer)
      console.log("Found organizer:", organizer ? organizer.email : "Not found")

      if (organizer && organizer.email) {
        console.log("Sending notification to organizer:", organizer.email)

        const notificationSent = await sendFormSubmissionNotification({
          eventName: event.title,
          formType,
          submissionData: formData,
          recipientEmail: organizer.email,
          recipientName: organizer.firstName,
          eventId: event._id.toString(),
          submissionId: submission._id.toString(),
        })

        console.log("Notification sent to organizer:", notificationSent)
      } else {
        console.error("Organizer not found or has no email:", event.organizer)
      }
    } catch (notificationError) {
      console.error("Error sending notification to organizer:", notificationError)
      // Don't fail the submission if notification fails
    }

    // Send confirmation email to the submitter
    try {
      if (submitterEmail) {
        console.log("Sending confirmation email to submitter:", submitterEmail)

        const confirmationSent = await sendSubmitterConfirmationEmail(
          formType,
          event.title,
          submitterEmail,
          submitterName || "",
          event._id.toString(),
        )

        console.log("Confirmation sent to submitter:", confirmationSent)
      } else {
        console.error("No email found for submitter")
      }
    } catch (confirmationError) {
      console.error("Error sending confirmation to submitter:", confirmationError)
      // Don't fail the submission if confirmation fails
    }

    return {
      success: true,
      message: `${formType} submission successful and pending approval`,
      submissionId: submission._id.toString(),
    }
  } catch (error: any) {
    console.error(`Error handling ${formType} form submission:`, error)
    return {
      success: false,
      message: error.message || `An error occurred while submitting the ${formType} form`,
    }
  }
}
