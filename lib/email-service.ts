import nodemailer from "nodemailer"

// Function to create and return a nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number.parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  })
}

// Generic function to send emails
export async function sendEmail({ to, subject, text, html }) {
  try {
    console.log(`Creating email transporter with host: ${process.env.EMAIL_HOST}, port: ${process.env.EMAIL_PORT}`)
    const transporter = createTransporter()

    const mailOptions = {
      from: `"TechEventPlanner" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    }

    console.log(`Sending email to ${to} with subject: ${subject}`)
    const info = await transporter.sendMail(mailOptions)
    console.log(`Email sent to ${to} with subject ${subject}. Message ID: ${info.messageId}`)
    return true
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error)
    return false
  }
}

// Function to send verification email
export async function sendVerificationEmail(email: string, firstName: string, verificationCode: string) {
  const subject = "TechEventPlanner - Verify Your Email"
  const text = `Hello ${firstName},

Thank you for signing up with TechEventPlanner! Please use the following verification code to verify your email:

${verificationCode}

This code will expire in 30 minutes.

Best regards,
TechEventPlanner Team`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify Your Email</h2>
      <p>Hello ${firstName},</p>
      <p>Thank you for signing up with TechEventPlanner! Please use the following verification code to verify your email:</p>
      <p style="font-size: 20px; font-weight: bold;">${verificationCode}</p>
      <p>This code will expire in 30 minutes.</p>
      <p>Best regards,<br>TechEventPlanner Team</p>
    </div>
  `

  return sendEmail({ to: email, subject, text, html })
}

// Function to send congratulations email
export async function sendCongratulationsEmail(email: string, firstName: string, role: string) {
  const subject = "Welcome to TechEventPlanner!"
  const text = `Hello ${firstName},

Your email has been successfully verified! You are now a registered ${role} on TechEventPlanner.

Best regards,
TechEventPlanner Team`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to TechEventPlanner!</h2>
      <p>Hello ${firstName},</p>
      <p>Your email has been successfully verified! You are now a registered ${role} on TechEventPlanner.</p>
      <p>Best regards,<br>TechEventPlanner Team</p>
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
      
      Thank you for using TechEventPlanner!
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
          Thank you for using TechEventPlanner!
        </p>
      </div>
    `

    return sendEmail({ to: recipientEmail, subject, text, html })
  } catch (error) {
    console.error("Error sending form submission notification:", error)
    return false
  }
}

// New function to send registration approval notification to attendees
export async function sendRegistrationApprovalEmail({
  eventName,
  attendeeEmail,
  attendeeName,
  eventDetails,
  eventId,
}: {
  eventName: string
  attendeeEmail: string
  attendeeName: string
  eventDetails: any
  eventId: string
}) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const eventUrl = `${appUrl}/events/${eventId}`

    const eventDate = eventDetails.startDate ? new Date(eventDetails.startDate).toLocaleDateString() : "TBD"
    const eventTime = eventDetails.startTime || "TBD"
    const eventLocation = eventDetails.location || "TBD"

    const subject = `Registration Approved: ${eventName}`
    const text = `
      Hello ${attendeeName},
      
      Great news! Your registration for "${eventName}" has been approved.
      
      Event Details:
      - Date: ${eventDate}
      - Time: ${eventTime}
      - Location: ${eventLocation}
      
      You can view the event details here: ${eventUrl}
      
      We look forward to seeing you at the event!
      
      Best regards,
      The TechEventPlanner Team
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
        </div>
        
        <p>
          <a href="${eventUrl}" style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Event Details
          </a>
        </p>
        
        <p>We look forward to seeing you at the event!</p>
        
        <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
          Best regards,<br>
          The TechEventPlanner Team
        </p>
      </div>
    `

    console.log(`Attempting to send approval email to ${attendeeEmail} for event ${eventName}`)

    const result = await sendEmail({ to: attendeeEmail, subject, text, html })

    if (result) {
      console.log(`Successfully sent approval email to ${attendeeEmail}`)
    } else {
      console.error(`Failed to send approval email to ${attendeeEmail}`)
    }

    return result
  } catch (error) {
    console.error("Error sending registration approval email:", error)
    return false
  }
}

// New function to send registration rejection notification to attendees
export async function sendRegistrationRejectionEmail({
  eventName,
  attendeeEmail,
  attendeeName,
}: {
  eventName: string
  attendeeEmail: string
  attendeeName: string
}) {
  try {
    const subject = `Registration Update: ${eventName}`
    const text = `
      Hello ${attendeeName},
      
      Thank you for your interest in "${eventName}".
      
      We regret to inform you that we are unable to approve your registration at this time. This could be due to various reasons such as capacity limitations or eligibility criteria.
      
      If you have any questions, please contact the event organizer directly.
      
      Thank you for your understanding.
      
      Best regards,
      The TechEventPlanner Team
    `

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #4f46e5;">Registration Update</h2>
        <p>Hello ${attendeeName},</p>
        <p>Thank you for your interest in <strong>"${eventName}"</strong>.</p>
        
        <p>We regret to inform you that we are unable to approve your registration at this time. This could be due to various reasons such as capacity limitations or eligibility criteria.</p>
        
        <p>If you have any questions, please contact the event organizer directly.</p>
        
        <p>Thank you for your understanding.</p>
        
        <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
          Best regards,<br>
          The TechEventPlanner Team
        </p>
      </div>
    `

    return sendEmail({ to: attendeeEmail, subject, text, html })
  } catch (error) {
    console.error("Error sending registration rejection email:", error)
    return false
  }
}
