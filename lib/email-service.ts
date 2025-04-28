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

// Common email styling
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
  infoTitle: `
    margin-top: 0;
    color: #111827;
    font-size: 18px;
    font-weight: 600;
  `,
  button: `
    display: inline-block;
    background-color: #4f46e5;
    color: white;
    font-weight: 500;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 6px;
    margin: 20px 0;
    text-align: center;
  `,
  footer: `
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
    color: #6b7280;
    font-size: 14px;
  `,
  highlight: `
    font-size: 18px;
    font-weight: bold;
    padding: 10px;
    background-color: #f3f4f6;
    border-radius: 4px;
    display: inline-block;
    margin: 10px 0;
  `,
}

// Generic function to send emails
export async function sendEmail({ to, subject, text, html }) {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: `"TechMilap" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Email sent to ${to} with subject ${subject}`)
    return true
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error)
    return false
  }
}

// Function to send verification email
export async function sendVerificationEmail(email: string, firstName: string, verificationCode: string) {
  const subject = "TechMilap - Verify Your Email"
  const text = `Hello ${firstName},

Thank you for signing up with TechMilap! Please use the following verification code to verify your email:

${verificationCode}

This code will expire in 30 minutes.

Best regards,
TechMilap Team`

  const html = `
    <div style="${emailStyles.container}">
      <div style="${emailStyles.header}">
        <div style="${emailStyles.logo}">TechMilap</div>
      </div>
      
      <h1 style="${emailStyles.title}">Verify Your Email</h1>
      
      <div style="${emailStyles.content}">
        <p>Hello ${firstName},</p>
        <p>Thank you for signing up with TechMilap! Please use the following verification code to verify your email:</p>
        
        <div style="${emailStyles.highlight}">${verificationCode}</div>
        
        <p>This code will expire in 30 minutes.</p>
      </div>
      
      <div style="${emailStyles.footer}">
        <p>Best regards,<br>TechMilap Team</p>
      </div>
    </div>
  `

  return sendEmail({ to: email, subject, text, html })
}

// Function to send congratulations email
export async function sendCongratulationsEmail(email: string, firstName: string, role: string) {
  const subject = "Welcome to TechMilap!"
  const text = `Hello ${firstName},

Your email has been successfully verified! You are now a registered ${role} on TechMilap.

Best regards,
TechMilap Team`

  const html = `
    <div style="${emailStyles.container}">
      <div style="${emailStyles.header}">
        <div style="${emailStyles.logo}">TechMilap</div>
      </div>
      
      <h1 style="${emailStyles.title}">Welcome to TechMilap!</h1>
      
      <div style="${emailStyles.content}">
        <p>Hello ${firstName},</p>
        <p>Your email has been successfully verified! You are now a registered ${role} on TechMilap.</p>
        
        <div style="${emailStyles.infoBox}">
          <h3 style="${emailStyles.infoTitle}">What's Next?</h3>
          <p>You can now explore events, register for upcoming gatherings, or create your own events!</p>
        </div>
      </div>
      
      <div style="${emailStyles.footer}">
        <p>Best regards,<br>TechMilap Team</p>
      </div>
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
      
      Thank you for using TechMilap!
    `

    const html = `
      <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
          <div style="${emailStyles.logo}">TechMilap</div>
        </div>
        
        <h1 style="${emailStyles.title}">New ${formTypeFormatted} Submission</h1>
        
        <div style="${emailStyles.content}">
          <p>Hello ${recipientName || "Event Organizer"},</p>
          <p>You have received a new ${formType} submission for your event <strong>"${eventName}"</strong>.</p>
          
          <div style="${emailStyles.infoBox}">
            <h3 style="${emailStyles.infoTitle}">Submission Summary</h3>
            ${submissionSummary}
            <p><strong>Submission ID:</strong> ${submissionId}</p>
          </div>
          
          <a href="${viewSubmissionUrl}" style="${emailStyles.button}">
            View All Submissions
          </a>
        </div>
        
        <div style="${emailStyles.footer}">
          <p>Thank you for using TechMilap!</p>
        </div>
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
      The TechMilap Team
    `

    const html = `
      <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
          <div style="${emailStyles.logo}">TechMilap</div>
        </div>
        
        <h1 style="${emailStyles.title}">Registration Approved!</h1>
        
        <div style="${emailStyles.content}">
          <p>Hello ${attendeeName},</p>
          <p>Great news! Your registration for <strong>"${eventName}"</strong> has been approved.</p>
          
          <div style="${emailStyles.infoBox}">
            <h3 style="${emailStyles.infoTitle}">Event Details</h3>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Time:</strong> ${eventTime}</p>
            <p><strong>Location:</strong> ${eventLocation}</p>
          </div>
          
          <a href="${eventUrl}" style="${emailStyles.button}">
            View Event Details
          </a>
          
          <p>We look forward to seeing you at the event!</p>
        </div>
        
        <div style="${emailStyles.footer}">
          <p>Best regards,<br>The TechMilap Team</p>
        </div>
      </div>
    `

    return sendEmail({ to: attendeeEmail, subject, text, html })
  } catch (error) {
    console.error("Error sending registration approval email:", error)
    return false
  }
}

// Function to send registration rejection notification to attendees
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
      The TechMilap Team
    `

    const html = `
      <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
          <div style="${emailStyles.logo}">TechMilap</div>
        </div>
        
        <h1 style="${emailStyles.title}">Registration Update</h1>
        
        <div style="${emailStyles.content}">
          <p>Hello ${attendeeName},</p>
          <p>Thank you for your interest in <strong>"${eventName}"</strong>.</p>
          
          <p>We regret to inform you that we are unable to approve your registration at this time. This could be due to various reasons such as capacity limitations or eligibility criteria.</p>
          
          <div style="${emailStyles.infoBox}">
            <h3 style="${emailStyles.infoTitle}">Need Help?</h3>
            <p>If you have any questions, please contact the event organizer directly.</p>
          </div>
          
          <p>Thank you for your understanding.</p>
        </div>
        
        <div style="${emailStyles.footer}">
          <p>Best regards,<br>The TechMilap Team</p>
        </div>
      </div>
    `

    return sendEmail({ to: attendeeEmail, subject, text, html })
  } catch (error) {
    console.error("Error sending registration rejection email:", error)
    return false
  }
}
