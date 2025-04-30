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
          subject: subject,
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
}: {
  eventName: string
  formType: string
  submissionData: any
  recipientEmail: string
  recipientName?: string
  eventId: string
  submissionId: string
}) {
  try {
    // Format the form type for display
    const formTypeFormatted = formType.charAt(0).toUpperCase() + formType.slice(1)

    // Create a summary of the submission data
    let submissionSummary = ""
    if (submissionData && typeof submissionData === "object") {
      // Extract key information for the email summary
      const keyFields = ["name", "email", "phone", "message", "interests", "availability"]

      for (const key of Object.keys(submissionData)) {
        if (keyFields.includes(key) && submissionData[key]) {
          const value = Array.isArray(submissionData[key]) ? submissionData[key].join(", ") : submissionData[key]
          submissionSummary += `<p><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}</p>`
        }
      }
    }

    if (!submissionSummary) {
      submissionSummary = "<p>No detailed information available.</p>"
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const viewSubmissionUrl = `${appUrl}/event-dashboard/${eventId}/${formType}s`

    const subject = `New ${formTypeFormatted} Submission for ${eventName}`
    const text = `
      Hello ${recipientName || "Event Organizer"},
      
      You have received a new ${formType} submission for your event "${eventName}".
      
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
  organizerEmail, // Add organizerEmail parameter
}: {
  eventName: string
  attendeeEmail: string
  attendeeName: string
  eventDetails: any
  eventId: string
  organizerEmail?: string // Make it optional to maintain backward compatibility
}) {
  try {
    if (!attendeeEmail) {
      console.error("No attendee email provided for approval notification")
      return false
    }

    console.log(`Preparing approval email for ${attendeeEmail}`)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const eventUrl = `${appUrl}/events/${eventId}`

    const eventDate = eventDetails.startDate ? new Date(eventDetails.startDate).toLocaleDateString() : "TBD"
    const eventTime = eventDetails.startTime || "TBD"
    const eventLocation = eventDetails.location || "TBD"
    const eventDescription = eventDetails.description || "No description provided."

    const subject = `Registration Approved: ${eventName}`
    const text = `
      Hello ${attendeeName},
      
      Great news! Your registration for "${eventName}" has been approved.
      
      Event Details:
      - Date: ${eventDate}
      - Time: ${eventTime}
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
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Time:</strong> ${eventTime}</p>
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

    // Send a copy to the organizer if an email is provided
    if (organizerEmail) {
      const organizerSubject = `Copy: Registration Approved for ${attendeeName} - ${eventName}`
      const organizerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #4f46e5;">Registration Approval Confirmation</h2>
          <p>This is a copy of the approval email sent to ${attendeeName} (${attendeeEmail}) for the event <strong>"${eventName}"</strong>.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Event Details</h3>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Time:</strong> ${eventTime}</p>
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
}: {
  eventName: string
  attendeeEmail: string
  attendeeName: string
  rejectionReason?: string
}) {
  try {
    if (!attendeeEmail) {
      console.error("No attendee email provided for rejection notification")
      return false
    }

    console.log(`Preparing rejection email for ${attendeeEmail}`)

    const subject = `Registration Update: ${eventName}`
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
