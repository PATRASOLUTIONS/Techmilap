// Import required modules
import { format, addMinutes } from "date-fns"
import { rateLimit } from "@/lib/rate-limit"
import { sendTemplatedEmail } from "@/lib/email-template-service"
import nodemailer from "nodemailer"
import { logWithTimestamp } from "@/utils/logger"
import { info } from "console"

// Create a rate limiter for email sending
const emailRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
  limit: 10, // 10 emails per interval per token
})

// Function to format date in Indian Standard Time (IST)
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

    // Convert to IST by adding 5 hours and 30 minutes
    const istDate = addMinutes(utcDate, 5 * 60 + 30)

    // Format the date using format function
    const formattedDate = format(istDate, "EEEE, MMMM d, yyyy")
    const formattedTime = format(istDate, "h:mm a")

    return `${formattedDate}, ${formattedTime} IST`
  } catch (error) {
    console.error("Error formatting date to IST:", error)
    return String(dateInput) || "Date TBA"
  }
}

// Sanitize email content to prevent XSS
function sanitizeHtml(html) {
  // Basic sanitization - in a real app, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/g, "")
    .replace(/javascript:/g, "")
}

// Create a reusable transporter object using SMTP transport
const createTransporter = () => {
  const secure = process.env.EMAIL_SECURE === "true"

  logWithTimestamp("info", "User", process.env.EMAIL_USER)

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number.parseInt(process.env.EMAIL_PORT || "587"),
    secure: secure, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false,
    },
  })
}

// New email service using the provided API
async function sendEmailViaAPI({ to, subject, text, html }) {
  try {
    console.log(`Sending email to ${to} with subject: ${subject} via API`)

    // Prepare email body
    const emailBody = html || text || `Subject: ${subject}`

    // Make API request
    const response = await fetch(
      "https://prod-22.southindia.logic.azure.com:443/workflows/6df0b999ee0c4e67b8c86d428bbc0eb6/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=mUyOOITrrkN_fiKdv12Yp11TJmNA_eZNzJ_-gQYpuDU",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: to,
          emailbody: emailBody,
          emailsubject: subject || "Notification from Tech Milap", // Provide a default subject if none is given
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API responded with status ${response.status}: ${errorText}`)
      return false
    }

    console.log(`Email sent successfully to ${to}`)
    return true
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error)
    return false
  }
}

// Generic function to send emails using SMTP - exported as required
export async function sendEmail({ to, subject, text, html, retries = 3 }) {

  return sendEmailViaAPI({ to, subject, text, html });

  // // Validate email address format
  // const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  // if (!emailRegex.test(to)) {
  //   console.error(`Invalid email address format: ${to}`)
  //   return false
  // }

  // // Apply rate limiting
  // try {
  //   await emailRateLimiter.check(5, to) // 5 tokens per email address
  // } catch (error) {
  //   console.error(`Rate limit exceeded for email: ${to}`)
  //   return false
  // }

  // // Sanitize HTML content
  // const sanitizedHtml = html ? sanitizeHtml(html) : null

  // let attempt = 0
  // while (attempt < retries) {
  //   try {
  //     attempt++
  //     console.log(`Email attempt ${attempt} to ${to} with subject: ${subject}`)

  //     // Create a transporter for each attempt to avoid connection issues
  //     const transporter = createTransporter()

  //     // Prepare the email options
  //     const mailOptions = {
  //       from: `Tech Milap <${process.env.EMAIL_USER}>`,
  //       to: to,
  //       subject: subject,
  //       text: text,
  //       html: sanitizedHtml || undefined,
  //     }

  //     console.log(`Sending email to ${to} with subject: ${subject}`)

  //     // Send the email
  //     const info = await transporter.sendMail(mailOptions)
  //     console.log(`Email sent to ${to}: ${info.messageId}`)
  //     return true
  //   } catch (error) {
  //     console.error(`Error sending email to ${to} (attempt ${attempt}/${retries}):`, error)

  //     // If we've reached max retries, give up
  //     if (attempt >= retries) {
  //       console.error(`Failed to send email to ${to} after ${retries} attempts`)
  //       return false
  //     }

  //     // Wait before retrying (exponential backoff)
  //     const delay = Math.pow(2, attempt) * 1000
  //     await new Promise((resolve) => setTimeout(resolve, delay))
  //   }
  // }

  // return false
}

// The rest of the file remains unchanged
// Function to send verification email
export async function sendVerificationEmail(email: string, firstName: string, verificationCode: string) {
  const subject = "Tech Milap - Verify Your Email"
  const text = `Hello ${firstName},

Thank you for signing up with Tech Milap! Please use the following verification code to verify your email:

${verificationCode}

This code will expire in 30 minutes.

Best regards,
Tech Milap Team`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify Your Email</h2>
      <p>Hello ${firstName},</p>
      <p>Thank you for signing up with Tech Milap! Please use the following verification code to verify your email:</p>
      <p style="font-size: 20px; font-weight: bold;">${verificationCode}</p>
      <p>This code will expire in 30 minutes.</p>
      <p>Best regards,<br>Tech Milap Team</p>
    </div>
  `

  return sendEmail({ to: email, subject, text, html })
}

// Function to send congratulations email
export async function sendCongratulationsEmail(email: string, firstName: string, role: string) {
  const subject = "Welcome to Tech Milap!"
  const text = `Hello ${firstName},

Your email has been successfully verified! You are now a registered ${role} on Tech Milap.

Best regards,
Tech Milap Team`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Tech Milap!</h2>
      <p>Hello ${firstName},</p>
      <p>Your email has been successfully verified! You are now a registered ${role} on Tech Milap.</p>
      <p>Best regards,<br>Tech Milap Team</p>
    </div>
  `

  return sendEmail({ to: email, subject, text, html })
}

// Function to send form submission notification
export async function sendFormSubmissionNotification({
  eventName,
  formType,
  submissionData,
  recipientEmail,
  recipientName,
  eventId,
  submissionId,
  emailSubject = null,
  eventDetails = null,
}: {
  eventName: string
  formType: string
  submissionData: any
  recipientEmail: string
  recipientName?: string
  eventId: string
  submissionId: string
  emailSubject?: string
  eventDetails?: any
}) {
  try {
    // Format the form type for display
    const formTypeFormatted = formType.charAt(0).toUpperCase() + formType.slice(1)

    // Format event date if details are provided
    let formattedDate = "Date TBA"
    if (eventDetails && eventDetails.date) {
      const eventDate = new Date(eventDetails.date)
      formattedDate = formatEventDate(eventDate)
    }

    // Create a summary of the submission data
    let submissionSummary = ""
    if (submissionData && typeof submissionData === "object") {
      // Extract key information for the email summary
      const keyFields = ["name", "email", "phone", "message", "interests", "availability"]

      // Look for dynamic field names with patterns like question_name_123456
      const dynamicFields = Object.keys(submissionData).filter(
        (key) => key.startsWith("question_") && !key.includes("csrf") && submissionData[key],
      )

      // Process standard fields first
      for (const key of Object.keys(submissionData)) {
        if (
          (keyFields.includes(key) || key.toLowerCase().includes("email") || key.toLowerCase().includes("name")) &&
          submissionData[key] &&
          !key.startsWith("question_") // Skip dynamic fields for now
        ) {
          const value = Array.isArray(submissionData[key]) ? submissionData[key].join(", ") : submissionData[key]
          submissionSummary += `<p><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}</p>`
        }
      }

      // Process dynamic fields
      for (const key of dynamicFields) {
        // Extract the field name from the dynamic key (e.g., "name" from "question_name_123456")
        const fieldNameMatch = key.match(/question_([^_]+)_/)
        if (fieldNameMatch && fieldNameMatch[1]) {
          const fieldName = fieldNameMatch[1]
          const value = Array.isArray(submissionData[key]) ? submissionData[key].join(", ") : submissionData[key]

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
    const viewSubmissionUrl = `${appUrl}/event-dashboard/${eventId}/${formType}s`

    // Use custom subject if provided, otherwise use default
    const subject = emailSubject || `New ${formTypeFormatted} Submission for ${eventName}`

    const text = `
      Hello ${recipientName || "Event Organizer"},
      
      You have received a new ${formType} submission for your event "${eventName}".
      
      Event Details:
      - Event: ${eventName}
      - Date: ${formattedDate}
      
      Submission ID: ${submissionId}
      
      To view all submissions, please visit: ${viewSubmissionUrl}
      
      Thank you for using Tech Milap!
    `

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #4f46e5;">New ${formTypeFormatted} Submission</h2>
        <p>Hello ${recipientName || "Event Organizer"},</p>
        <p>You have received a new ${formType} submission for your event <strong>"${eventName}"</strong>.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Event Details</h3>
          <p><strong>Event:</strong> ${eventName}</p>
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

    return sendEmail({ to: recipientEmail, subject, text, html })
  } catch (error) {
    console.error("Error sending form submission notification:", error)
    return false
  }
}

// Enhanced function to send registration approval notification to attendees
export async function sendRegistrationApprovalEmail({
  eventName,
  attendeeEmail,
  attendeeName,
  eventDetails,
  eventId,
  organizerEmail,
  emailSubject = "Registration Approved",
  organizerId
}: {
  eventName: string
  attendeeEmail: string
  attendeeName: string
  eventDetails: any
  eventId: string
  organizerEmail?: string
  emailSubject?: string
  organizerId?: string
}) {
  try {
    if (!attendeeEmail) {
      console.error("No attendee email provided for approval notification")
      return false
    }

    console.log(`Preparing approval email for ${attendeeEmail}`)

    // Format the event date in IST
    let formattedDate = "Date TBA"
    if (eventDetails && eventDetails.date) {
      const eventDate = new Date(eventDetails.date)
      formattedDate = formatEventDate(eventDate)
    }

    const eventLocation = eventDetails.location || eventDetails.venue || "TBD"
    const eventDescription = eventDetails.description || "No description provided."
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const eventUrl = `${appUrl}/events/${eventId}`

    // Prepare variables for the template
    const variables = {
      attendeeName,
      eventName,
      eventDate: formattedDate,
      eventTime: formattedDate.split(", ")[1] || "TBA",
      eventLocation,
      eventDescription,
      eventUrl,
      organizerName: eventDetails.organizerName || "Event Organizer",
    }

    // Use the enhanced templated email service
    const result = await sendTemplatedEmail({
      userId: organizerId?.toString() || "",
      templateType: "success",
      recipientEmail: attendeeEmail,
      recipientName: attendeeName,
      eventId,
      variables,
      customSubject: emailSubject,
      metadata: {
        eventId,
        attendeeId: eventDetails.attendeeId,
        notificationType: "registration_approval",
      },
    })

    // Always send a copy to samik.n.roy@gmail.com
    const adminEmail = "samik.n.roy@gmail.com"
    const adminSubject = `[ADMIN COPY] Registration Approved: ${attendeeName} - ${eventName}`
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #4f46e5;">Registration Approval - Admin Copy</h2>
        <p>This is an admin copy of the approval email sent to ${attendeeName} (${attendeeEmail}) for the event <strong>"${eventName}"</strong>.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Event Details</h3>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Location:</strong> ${eventLocation}</p>
          <p><strong>Attendee:</strong> ${attendeeName} (${attendeeEmail})</p>
        </div>
        
        <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
          This is an automated notification from Tech Milap.
        </p>
      </div>
    `

    await sendEmail({
      to: adminEmail,
      subject: adminSubject,
      text: `[ADMIN COPY] Registration approved for ${attendeeName} (${attendeeEmail}) for event "${eventName}".`,
      html: adminHtml,
    })

    console.log(`Admin copy sent to ${adminEmail}`)

    // Send a copy to the organizer if an email is provided
    if (organizerEmail) {
      const organizerSubject = `Copy: Registration Approved for ${attendeeName} - ${eventName}`
      const organizerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #4f46e5;">Registration Approval Confirmation</h2>
          <p>This is a copy of the approval email sent to ${attendeeName} (${attendeeEmail}) for the event <strong>"${eventName}"</strong>.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Event Details</h3>
          <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Location:</strong> ${eventLocation}</p>
            <p><strong>Attendee:</strong> ${attendeeName} (${attendeeEmail})</p>
          </div>
          
          <p style="background-color: #fff8e6; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b;">
            <strong>Note:</strong> If you need any additional assistance or have specific requirements for this event, 
            please contact us at <a href="mailto:info@techmilap.com">info@techmilap.com</a>.
          </p>
          
          <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
            Thank you for using Tech Milap!
          </p>
        </div>
      `

      await sendEmail({
        to: organizerEmail,
        subject: organizerSubject,
        text: `This is a copy of the approval email sent to ${attendeeName} (${attendeeEmail}) for the event "${eventName}". If you need any additional assistance, please contact info@techmilap.com.`,
        html: organizerHtml,
      })
    }

    if (result) {
      console.log(`Successfully sent approval email to ${attendeeEmail}`)
    } else {
      console.error(`Failed to send approval email to ${attendeeEmail}`)
    }

    return result
  } catch (error) {
    console.error("Error sending registration approval email:", error)
    console.error("Error details:", error)
    return false
  }
}

// Enhanced function to send registration rejection notification to attendees
export async function sendRegistrationRejectionEmail({
  eventName,
  attendeeEmail,
  attendeeName,
  rejectionReason,
  emailSubject = "Registration Rejected",
  eventId,
  eventDetails = null,
  organizerEmail,
  organizerId,
}: {
  eventName: string
  attendeeEmail: string
  attendeeName: string
  rejectionReason?: string
  emailSubject?: string
  eventId?: string
  eventDetails?: any
  organizerEmail?: string
  organizerId?: string
}) {
  try {
    if (!attendeeEmail) {
      console.error("No attendee email provided for rejection notification")
      return false
    }

    console.log(`Preparing rejection email for ${attendeeEmail}`)
    const reason = rejectionReason || "due to capacity limitations or eligibility criteria."

    // Prepare variables for the template
    const variables = {
      attendeeName,
      eventName,
      rejectionReason: reason,
      organizerName: eventDetails?.organizerName || "Event Organizer",
    }

    // Use the enhanced templated email service if we have event details
    let result = false
    if (eventId && eventDetails && eventDetails.organizer) {
      result = await sendTemplatedEmail({
        userId: organizerId?.toString() || "",
        templateType: "rejection",
        recipientEmail: attendeeEmail,
        recipientName: attendeeName,
        eventId,
        variables,
        customSubject: emailSubject,
        metadata: {
          eventId,
          attendeeId: eventDetails.attendeeId,
          notificationType: "registration_rejection",
          rejectionReason: reason,
        },
      })
    } else {
      // Fallback to direct email if we don't have enough details
      const subject = emailSubject || `Registration Update: ${eventName}`
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #4f46e5;">Registration Update</h2>
          <p>Hello ${attendeeName},</p>
          <p>Thank you for your interest in <strong>"${eventName}"</strong>.</p>
          
          <p>We regret to inform you that we are unable to approve your registration at this time ${reason}.</p>
          
          <p>If you have any questions, please contact the event organizer directly.</p>
          
          <p>Thank you for your understanding.</p>
          
          <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
            Best regards,<br>
            The Tech Milap Team
          </p>
        </div>
      `

      const text = `
        Hello ${attendeeName},
        
        Thank you for your interest in "${eventName}".
        
        We regret to inform you that we are unable to approve your registration at this time ${reason}.
        
        If you have any questions, please contact the event organizer directly.
        
        Thank you for your understanding.
        
        Best regards,
        The Tech Milap Team
      `

      result = await sendEmail({
        to: attendeeEmail,
        subject,
        text,
        html,
      })
    }

    // Always send a copy to samik.n.roy@gmail.com for rejections too
    const adminEmail = "samik.n.roy@gmail.com"
    const adminSubject = `[ADMIN COPY] Registration Rejected: ${attendeeName} - ${eventName}`
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #dc2626;">Registration Rejection - Admin Copy</h2>
        <p>This is an admin copy of the rejection email sent to ${attendeeName} (${attendeeEmail}) for the event <strong>"${eventName}"</strong>.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Rejection Details</h3>
          <p><strong>Attendee:</strong> ${attendeeName} (${attendeeEmail})</p>
          <p><strong>Reason:</strong> ${reason}</p>
        </div>
        
        <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
          This is an automated notification from Tech Milap.
        </p>
      </div>
    `

    await sendEmail({
      to: adminEmail,
      subject: adminSubject,
      text: `[ADMIN COPY] Registration rejected for ${attendeeName} (${attendeeEmail}) for event "${eventName}". Reason: ${reason}`,
      html: adminHtml,
    })

    console.log(`Admin copy of rejection sent to ${adminEmail}`)

    // Format the event date in IST
    let formattedDate = "Date TBA"
    if (eventDetails && eventDetails.date) {
      const eventDate = new Date(eventDetails.date)
      formattedDate = formatEventDate(eventDate)
    }

    // Send a copy to the organizer if an email is provided
    if (organizerEmail) {
      const organizerSubject = `Copy: Registration Rejected for ${attendeeName} - ${eventName}`
      const organizerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #4f46e5;">Registration Rejected</h2>
          <p>This is a copy of the rejection email sent to ${attendeeName} (${attendeeEmail}) for the event <strong>"${eventName}"</strong>.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Event Details</h3>
          <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Location:</strong> ${eventDetails.location}</p>
            <p><strong>Attendee:</strong> ${attendeeName} (${attendeeEmail})</p>
          </div>
          
          <p style="background-color: #fff8e6; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b;">
            <strong>Note:</strong> If you need any additional assistance or have specific requirements for this event, 
            please contact us at <a href="mailto:info@techmilap.com">info@techmilap.com</a>.
          </p>
          
          <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
            Thank you for using Tech Milap!
          </p>
        </div>
      `

      await sendEmail({
        to: organizerEmail,
        subject: organizerSubject,
        text: `This is a copy of the rejection email sent to ${attendeeName} (${attendeeEmail}) for the event "${eventName}". If you need any additional assistance, please contact info@techmilap.com.`,
        html: organizerHtml,
      })
    }

    if (result) {
      console.log(`Successfully sent rejection email to ${attendeeEmail}`)
    } else {
      console.error(`Failed to send rejection email to ${attendeeEmail}`)
    }

    return result
  } catch (error) {
    console.error("Error sending registration rejection email:", error)
    console.error("Error details:", error)
    return false
  }
}
