import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email-service"

export async function handleFormSubmission(
  eventIdOrSlug: string,
  formType: string,
  formData: any,
  userId: string | null,
  emailSubject?: string, // Add optional emailSubject parameter
) {
  try {
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
    const email = formData.email || formData.corporateEmail || formData.userEmail || formData.emailAddress || ""

    // Ensure name consistency - check all possible name fields
    const firstName = formData.firstName || formData.first_name || ""
    const lastName = formData.lastName || formData.last_name || ""
    const fullName = formData.name || formData.fullName || ""

    // Construct name from available fields
    const name = fullName || (firstName && lastName ? `${firstName} ${lastName}` : firstName || "Attendee")

    // Create the submission document with consistent email and name
    const submission = {
      eventId: event._id,
      userId: userId ? new ObjectId(userId) : null,
      userName: name,
      userEmail: email, // Use consistent email
      formType,
      status,
      data: {
        ...formData,
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

// Function to format date in Indian Standard Time (IST)
function formatEventDate(dateInput, startTime, endTime) {
  if (!dateInput) return "TBD"

  try {
    // Handle MongoDB date format if present
    let dateObj
    if (typeof dateInput === "object" && dateInput.$date) {
      dateObj = new Date(dateInput.$date)
    } else if (typeof dateInput === "string") {
      dateObj = new Date(dateInput)
    } else {
      dateObj = dateInput
    }

    // Check if valid date
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return "TBD"
    }

    // Convert to Indian Standard Time (UTC+5:30)
    const istOffsetHours = 5
    const istOffsetMinutes = 30

    // Create a new date object with IST offset
    const istDate = new Date(dateObj.getTime() + (istOffsetHours * 60 + istOffsetMinutes) * 60 * 1000)

    // Month names for formatting
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    // Format date components
    const day = istDate.getUTCDate()
    const month = monthNames[istDate.getUTCMonth()]
    const year = istDate.getUTCFullYear()

    // Format time if provided separately
    let timeStr = ""
    if (startTime && endTime) {
      // Convert 24-hour format to 12-hour format with AM/PM
      const formatTimeStr = (timeStr) => {
        const [hours, minutes] = timeStr.split(":").map(Number)
        const period = hours >= 12 ? "PM" : "AM"
        const hours12 = hours % 12 || 12
        return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`
      }

      timeStr = `, ${formatTimeStr(startTime)} - ${formatTimeStr(endTime)} IST`
    }

    return `${month} ${day}, ${year}${timeStr}`
  } catch (error) {
    console.error("Error formatting date:", error)
    return String(dateInput) || "TBD"
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
    const formattedDate = formatEventDate(event.date, event.startTime, event.endTime)

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #4f46e5;">Submission Received</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for your ${formTypeDisplay} for <strong>"${event.title || event.name}"</strong>.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Event Details</h3>
          <p><strong>Event:</strong> ${event.title || event.name}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
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
    const formattedDate = formatEventDate(event.date, event.startTime, event.endTime)

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
          <p><strong>Date:</strong> ${formattedDate}</p>
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
      - Date: ${formattedDate}
      
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
