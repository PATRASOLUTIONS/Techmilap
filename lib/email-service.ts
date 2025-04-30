// import nodemailer from "nodemailer"

// Function to create a nodemailer transporter
// function createTransporter() {
//   return nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: Number.parseInt(process.env.EMAIL_PORT || "587", 10),
//     secure: process.env.EMAIL_SECURE === "true",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//     tls: {
//       // Do not fail on invalid certs
//       rejectUnauthorized: false,
//     },
//   })
// }

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

    // Get date components directly from the IST date
    const day = istDate.getDate() // Use getDate() instead of getUTCDate()
    const month = monthNames[istDate.getMonth()] // Use getMonth() instead of getUTCMonth()
    const year = istDate.getFullYear() // Use getFullYear() instead of getUTCFullYear()

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

// Generic function to send emails - exported as required
export async function sendEmail({ to, subject, text, html }) {
  return sendEmailViaAPI({ to, subject, text, html })

  // Original nodemailer implementation (commented out)
  // try {
  //   console.log(`Creating email transporter with host: ${process.env.EMAIL_HOST}, port: ${process.env.EMAIL_PORT}`)
  //   const transporter = createTransporter()

  //   const mailOptions = {
  //     from: `"Tech Milap" <${process.env.EMAIL_USER}>`,
  //     to,
  //     subject,
  //     text,
  //     html,
  //   }

  //   console.log(`Sending email to ${to} with subject: ${subject}`)
  //   const info = await transporter.sendMail(mailOptions)
  //   console.log(`Email sent to ${to} with subject ${subject}. Message ID: ${info.messageId}`)
  //   return true
  // } catch (error) {
  //   console.error(`Error sending email to ${to}:`, error)
  //   console.error(`Error details:`, error)
  //   return false
  // }
}

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
  emailSubject = null, // Add optional emailSubject parameter
  eventDetails = null, // Add event details parameter
}: {
  eventName: string
  formType: string
  submissionData: any
  recipientEmail: string
  recipientName?: string
  eventId: string
  submissionId: string
  emailSubject?: string // Add type for emailSubject
  eventDetails?: any // Add type for eventDetails
}) {
  try {
    // Format the form type for display
    const formTypeFormatted = formType.charAt(0).toUpperCase() + formType.slice(1)

    console.log("date-------------------------------"+eventDetails.date)

    // Format event date if details are provided
    let formattedDate = "TBD"
    if (eventDetails) {
      formattedDate = formatEventDate(
        eventDetails.date || eventDetails.startDate,
        eventDetails.startTime,
        eventDetails.endTime,
      )
    }

    // Create a summary of the submission data in markdown format
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

// Function to send registration approval notification to attendees
export async function sendRegistrationApprovalEmail({
  eventName,
  attendeeEmail,
  attendeeName,
  eventDetails,
  eventId,
  organizerEmail,
  emailSubject = null, // Add optional emailSubject parameter
}: {
  eventName: string
  attendeeEmail: string
  attendeeName: string
  eventDetails: any
  eventId: string
  organizerEmail?: string
  emailSubject?: string // Add type for emailSubject
}) {
  try {
    if (!attendeeEmail) {
      console.error("No attendee email provided for approval notification")
      return false
    }

    console.log(`Preparing approval email for ${attendeeEmail}`)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const eventUrl = `${appUrl}/events/${eventId}`

    // Format the event date in IST
    const formattedDate = formatEventDate(
      eventDetails.date || eventDetails.startDate,
      eventDetails.startTime,
      eventDetails.endTime,
    )

    const eventLocation = eventDetails.location || eventDetails.venue || "TBD"
    const eventDescription = eventDetails.description || "No description provided."

    // Use custom subject if provided, otherwise use default
    const subject = emailSubject || `Registration Approved: ${eventName}`

    const text = `
      Hello ${attendeeName},
      
      Great news! Your registration for "${eventName}" has been approved.
      
      Event Details:
      - Date: ${formattedDate}
      - Location: ${eventLocation}
      - Description: ${eventDescription}
      
      You can view the event details here: ${eventUrl}
      
      We look forward to seeing you at the event!
      
      Best regards,
      The Tech Milap Team
    `

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #4f46e5;">Registration Approved!</h2>
        <p>Hello ${attendeeName},</p>
        <p>Great news! Your registration for <strong>"${eventName}"</strong> has been approved.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Event Details</h3>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Location:</strong> ${eventLocation}</p>
          <p><strong>Description:</strong> ${eventDescription}</p>
        </div>
        
        <p>
          <a href="${eventUrl}" style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Event Details
          </a>
        </p>
        
        <p>We look forward to seeing you at the event!</p>
        
        <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
          Best regards,<br>
          The Tech Milap Team
        </p>
      </div>
    `

    console.log(`Attempting to send approval email to ${attendeeEmail} for event ${eventName}`)

    const result = await sendEmail({ to: attendeeEmail, subject, text, html })

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

// Function to send registration rejection notification to attendees
export async function sendRegistrationRejectionEmail({
  eventName,
  attendeeEmail,
  attendeeName,
  rejectionReason,
  emailSubject = null, // Add optional emailSubject parameter
}: {
  eventName: string
  attendeeEmail: string
  attendeeName: string
  rejectionReason?: string
  emailSubject?: string // Add type for emailSubject
}) {
  try {
    if (!attendeeEmail) {
      console.error("No attendee email provided for rejection notification")
      return false
    }

    console.log(`Preparing rejection email for ${attendeeEmail}`)

    // Use custom subject if provided, otherwise use default
    const subject = emailSubject || `Registration Update: ${eventName}`
    const reason = rejectionReason || "due to capacity limitations or eligibility criteria."

    const text = `
      Hello ${attendeeName},
      
      Thank you for your interest in "${eventName}".
      
      We regret to inform you that we are unable to approve your registration at this time ${reason}.
      
      If you have any questions, please contact the event organizer directly.
      
      Thank you for your understanding.
      
      Best regards,
      The Tech Milap Team
    `

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

    console.log(`Attempting to send rejection email to ${attendeeEmail} for event ${eventName}`)
    const result = await sendEmail({ to: attendeeEmail, subject, text, html })

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
