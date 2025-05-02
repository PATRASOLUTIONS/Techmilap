import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email-service"
import { format, addMinutes } from "date-fns"
import { z } from "zod"

// Define validation schema for form submission
const FormSubmissionSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email("Valid email is required").optional(),
    userEmail: z.string().email("Valid email is required").optional(),
    corporateEmail: z.string().email("Valid corporate email is required").optional(),
    status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  })
  .catchall(z.any())

// Function to convert UTC date to IST and format it
function formatEventDate(dateInput) {
  try {
    if (!dateInput) return "Date TBA"

    // Handle different date input formats
    let utcDate

    // Handle MongoDB date format
    if (typeof dateInput === "object" && dateInput.$date) {
      utcDate = new Date(dateInput.$date)
    }
    // Handle Date object
    else if (dateInput instanceof Date) {
      utcDate = dateInput
    }
    // Handle string date
    else if (typeof dateInput === "string") {
      utcDate = new Date(dateInput)
    }
    // Handle other formats
    else {
      utcDate = new Date(dateInput)
    }

    // Check if valid date
    if (!(utcDate instanceof Date) || isNaN(utcDate.getTime())) {
      console.error("Invalid date input:", dateInput)
      return "Date TBA"
    }

    // Log the original UTC date
    console.log("Original UTC date:", utcDate.toISOString())

    // Convert to IST by adding 5 hours and 30 minutes
    const istDate = addMinutes(utcDate, 5 * 60 + 30)

    // Log the converted IST date
    console.log("Converted IST date:", istDate.toISOString())

    // Format the date using format function
    const formattedDate = format(istDate, "EEEE, MMMM d, yyyy")
    const formattedTime = format(istDate, "h:mm a")

    return `${formattedDate}, ${formattedTime} IST`
  } catch (error) {
    console.error("Error formatting date to IST:", error)
    return String(dateInput) || "Date TBA"
  }
}

// Function to format time in 12-hour format
function formatTime(timeStr) {
  if (!timeStr) return ""

  try {
    const [hours, minutes] = timeStr.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const hours12 = hours % 12 || 12
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`
  } catch (error) {
    console.error("Error formatting time:", error)
    return timeStr
  }
}

// Sanitize form data to prevent injection attacks
function sanitizeFormData(data: any) {
  if (!data || typeof data !== "object") return data

  const sanitized = { ...data }

  // Sanitize string values
  Object.keys(sanitized).forEach((key) => {
    if (typeof sanitized[key] === "string") {
      // Basic sanitization - remove script tags and dangerous attributes
      sanitized[key] = sanitized[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/g, "")
        .replace(/javascript:/g, "")
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeFormData(sanitized[key])
    }
  })

  return sanitized
}

export async function handleFormSubmission(
  eventIdOrSlug: string,
  formType: string,
  formData: any,
  userId: string | null,
  emailSubject?: string,
) {
  try {
    // Validate form data
    const validationResult = FormSubmissionSchema.safeParse(formData)
    if (!validationResult.success) {
      return {
        success: false,
        message: "Invalid form data",
        errors: validationResult.error.format(),
      }
    }

    // Sanitize form data
    const sanitizedFormData = sanitizeFormData(validationResult.data)

    const { db } = await connectToDatabase()

    // Find the event by ID or slug
    let event
    try {
      const objectId = new ObjectId(eventIdOrSlug)
      event = await db.collection("events").findOne({ _id: objectId })
    } catch (error) {
      // If not a valid ObjectId, try to find by slug
      event = await db.collection("events").findOne({ slug: eventIdOrSlug })
    }

    if (!event) {
      return { success: false, message: "Event not found" }
    }

    // Always set status to pending for all form types
    const status = "pending"

    // Ensure email consistency - check all possible email fields
    const email =
      sanitizedFormData.email ||
      sanitizedFormData.corporateEmail ||
      sanitizedFormData.userEmail ||
      sanitizedFormData.emailAddress ||
      ""

    // Ensure name consistency - check all possible name fields
    const firstName = sanitizedFormData.firstName || sanitizedFormData.first_name || ""
    const lastName = sanitizedFormData.lastName || sanitizedFormData.last_name || ""
    const fullName = sanitizedFormData.name || sanitizedFormData.fullName || ""

    // Construct name from available fields
    const name = fullName || (firstName && lastName ? `${firstName} ${lastName}` : firstName || "Attendee")

    // Check for duplicate submission
    const existingSubmission = await db.collection("formsubmissions").findOne({
      eventId: event._id,
      userEmail: email,
      formType,
    })

    if (existingSubmission) {
      return {
        success: false,
        message: `You have already submitted a ${formType} form for this event`,
        submissionId: existingSubmission._id.toString(),
        status: existingSubmission.status,
      }
    }

    // Create the submission document with consistent email and name
    const submission = {
      eventId: event._id,
      userId: userId ? new ObjectId(userId) : null,
      userName: name,
      userEmail: email, // Use consistent email
      formType,
      status,
      data: {
        ...sanitizedFormData,
        email: email, // Ensure email is consistent in data object
        name: name,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Insert the submission
    const result = await db.collection("formsubmissions").insertOne(submission)

    // Send confirmation email to the user
    await sendConfirmationEmailToUser(event, formType, name, email, emailSubject)

    // Send notification email to the organizer
    await sendNotificationEmailToOrganizer(event, formType, submission, result.insertedId.toString(), emailSubject)

    // Return success response
    return {
      success: true,
      message: `${formType} submission received and pending approval`,
      submissionId: result.insertedId.toString(),
    }
  } catch (error) {
    console.error("Error handling form submission:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Function to send confirmation email to the user
async function sendConfirmationEmailToUser(event, formType, userName, userEmail, emailSubject = null) {
  try {
    if (!userEmail || typeof userEmail !== "string" || !userEmail.includes("@")) {
      console.error(`Invalid user email address: "${userEmail}"`)
      return false
    }

    // Format the form type for display
    const formTypeDisplay = formType === "attendee" ? "registration" : `${formType} application`

    // Use custom subject if provided, otherwise use default
    const subject = emailSubject || `Your ${formTypeDisplay} for ${event.title || event.name} has been received`

    // Format the event date in IST
    const eventDate = event.date ? new Date(event.date) : null
    const formattedDate = eventDate ? format(eventDate, "EEEE, MMMM d, yyyy") : "Date TBA"
    const formattedTime = eventDate ? format(eventDate, "h:mm a") : "Time TBA"

    // Format start and end times if available
    let timeInfo = ""
    if (event.startTime && event.endTime) {
      timeInfo = ` (${formatTime(event.startTime)} - ${formatTime(event.endTime)})`
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #4f46e5;">Submission Received</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for your ${formTypeDisplay} for <strong>"${event.title || event.name}"</strong>.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Event Details</h3>
          <p><strong>Event:</strong> ${event.title || event.name}</p>
          <p><strong>Date:</strong> ${formattedDate}${timeInfo}</p>
          <p><strong>Location:</strong> ${event.location || event.venue || "TBD"}</p>
        </div>
        
        <p>Your submission is currently under review. We will notify you once it has been processed.</p>
        
        <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
          Best regards,<br />
          The Tech Milap Team
        </p>
      </div>
    `

    const text = `
      Hello ${userName},
      
      Thank you for your ${formTypeDisplay} for "${event.title || event.name}".
      
      Event Details:
      - Event: ${event.title || event.name}
      - Date: ${formattedDate}
      - Location: ${event.location || event.venue || "TBD"}
      
      Your submission is currently under review. We will notify you once it has been processed.
      
      Best regards,
      The Tech Milap Team
    `

    await sendEmail({
      to: userEmail,
      subject,
      html,
      text,
    })

    console.log(`Confirmation email sent to user: ${userEmail}`)
    return true
  } catch (error) {
    console.error("Error sending confirmation email to user:", error)
    return false
  }
}

// Function to send notification email to the organizer
async function sendNotificationEmailToOrganizer(event, formType, submission, submissionId, emailSubject = null) {
  try {
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

    // Format the event date in IST
    const eventDate = event.date ? new Date(event.date) : null
    const formattedDate = eventDate ? format(eventDate, "EEEE, MMMM d, yyyy") : "Date TBA"
    const formattedTime = eventDate ? format(eventDate, "h:mm a") : "Time TBA"

    // Format start and end times if available
    let timeInfo = ""
    if (event.startTime && event.endTime) {
      timeInfo = ` (${formatTime(event.startTime)} - ${formatTime(event.endTime)})`
    }

    // Create a summary of the submission data in markdown format
    let submissionSummary = ""
    if (submission.data && typeof submission.data === "object") {
      // Extract key information for the email summary
      const keyFields = [
        "name",
        "firstName",
        "lastName",
        "email",
        "corporateEmail",
        "phone",
        "message",
        "interests",
        "availability",
      ]

      // Look for dynamic field names with patterns like question_name_123456
      const dynamicFields = Object.keys(submission.data).filter(
        (key) => key.startsWith("question_") && !key.includes("csrf") && submission.data[key],
      )

      // Process standard fields first
      for (const key of Object.keys(submission.data)) {
        if (
          (keyFields.includes(key) || key.toLowerCase().includes("email") || key.toLowerCase().includes("name")) &&
          submission.data[key] &&
          !key.startsWith("question_") // Skip dynamic fields for now
        ) {
          const value = Array.isArray(submission.data[key]) ? submission.data[key].join(", ") : submission.data[key]
          submissionSummary += `<p><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}</p>`
        }
      }

      // Process dynamic fields
      for (const key of dynamicFields) {
        // Extract the field name from the dynamic key (e.g., "name" from "question_name_123456")
        const fieldNameMatch = key.match(/question_([^_]+)_/)
        if (fieldNameMatch && fieldNameMatch[1]) {
          const fieldName = fieldNameMatch[1]
          const value = Array.isArray(submission.data[key]) ? submission.data[key].join(", ") : submission.data[key]

          // Format field name for display (capitalize first letter)
          const displayName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1)

          submissionSummary += `<p><strong>${displayName}:</strong> ${value}</p>`
        }
      }
    }

    if (!submissionSummary) {
      submissionSummary = "<p>No detailed information available.</p>"
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const viewSubmissionUrl = `${appUrl}/event-dashboard/${event._id}/${formType}s`

    // Use custom subject if provided, otherwise use default
    const subject = emailSubject || `New ${formTypeFormatted} Submission for ${event.title || event.name}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #4f46e5;">New ${formTypeFormatted} Submission</h2>
        <p>Hello Event Organizer,</p>
        <p>You have received a new ${formType} submission for your event <strong>"${event.title || event.name}"</strong>.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Event Details</h3>
          <p><strong>Event:</strong> ${event.title || event.name}</p>
          <p><strong>Date:</strong> ${formattedDate}${timeInfo}</p>
        </div>
        
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
          Thank you for using Tech Milap!
        </p>
      </div>
    `

    const text = `
      Hello Event Organizer,
      
      You have received a new ${formType} submission for your event "${event.title || event.name}".
      
      Event Details:
      - Event: ${event.title || event.name}
      - Date: ${formattedDate}${timeInfo}
      
      Submission ID: ${submissionId}
      
      To view all submissions, please visit: ${viewSubmissionUrl}
      
      Thank you for using Tech Milap!
    `

    await sendEmail({
      to: organizerEmail,
      subject,
      html,
      text,
    })

    console.log(`Notification email sent to organizer: ${organizerEmail}`)
    return true
  } catch (error) {
    console.error("Error sending notification email to organizer:", error)
    return false
  }
}
