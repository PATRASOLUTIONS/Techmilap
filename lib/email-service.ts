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
    const transporter = createTransporter()

    const mailOptions = {
      from: `"TechEventPlanner" <${process.env.EMAIL_USER}>`,
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
