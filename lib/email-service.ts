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

// Function to send approval notification to volunteers
export async function sendVolunteerApprovalEmail({
  eventName,
  eventDate,
  eventLocation,
  recipientEmail,
  recipientName,
  eventId,
  eventSlug,
  organizerName,
  organizerEmail,
  volunteerRole,
  additionalInfo,
}: {
  eventName: string
  eventDate: string
  eventLocation: string
  recipientEmail: string
  recipientName: string
  eventId: string
  eventSlug: string
  organizerName: string
  organizerEmail: string
  volunteerRole?: string
  additionalInfo?: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const eventUrl = `${appUrl}/events/${eventSlug || eventId}`

  const subject = `Good News! You've Been Approved as a Volunteer for ${eventName}`

  const text = `
    Hello ${recipientName},
    
    Great news! Your application to volunteer at "${eventName}" has been approved.
    
    Event Details:
    - Name: ${eventName}
    - Date: ${eventDate}
    - Location: ${eventLocation}
    ${volunteerRole ? `- Your Role: ${volunteerRole}` : ""}
    
    ${additionalInfo ? `Additional Information: ${additionalInfo}` : ""}
    
    Please visit ${eventUrl} for more details about the event.
    
    If you have any questions, please contact the event organizer at ${organizerEmail}.
    
    Thank you for volunteering!
    
    Best regards,
    ${organizerName}
    Event Organizer
  `

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #4f46e5;">You're Approved as a Volunteer!</h2>
      
      <p>Hello ${recipientName},</p>
      
      <p>Great news! Your application to volunteer at <strong>"${eventName}"</strong> has been approved.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Event Details</h3>
        <p><strong>Name:</strong> ${eventName}</p>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Location:</strong> ${eventLocation}</p>
        ${volunteerRole ? `<p><strong>Your Role:</strong> ${volunteerRole}</p>` : ""}
      </div>
      
      ${
        additionalInfo
          ? `
      <div style="margin: 20px 0;">
        <h3>Additional Information</h3>
        <p>${additionalInfo}</p>
      </div>
      `
          : ""
      }
      
      <p>
        <a href="${eventUrl}" style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Event Details
        </a>
      </p>
      
      <p>If you have any questions, please contact the event organizer at <a href="mailto:${organizerEmail}">${organizerEmail}</a>.</p>
      
      <p>Thank you for volunteering!</p>
      
      <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
        Best regards,<br>
        ${organizerName}<br>
        Event Organizer
      </p>
    </div>
  `

  return sendEmail({ to: recipientEmail, subject, text, html })
}

// Function to send approval notification to speakers
export async function sendSpeakerApprovalEmail({
  eventName,
  eventDate,
  eventLocation,
  recipientEmail,
  recipientName,
  eventId,
  eventSlug,
  organizerName,
  organizerEmail,
  presentationTitle,
  presentationTime,
  additionalInfo,
}: {
  eventName: string
  eventDate: string
  eventLocation: string
  recipientEmail: string
  recipientName: string
  eventId: string
  eventSlug: string
  organizerName: string
  organizerEmail: string
  presentationTitle?: string
  presentationTime?: string
  additionalInfo?: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const eventUrl = `${appUrl}/events/${eventSlug || eventId}`

  const subject = `Congratulations! You're Confirmed as a Speaker for ${eventName}`

  const text = `
    Hello ${recipientName},
    
    Congratulations! Your application to speak at "${eventName}" has been approved.
    
    Event Details:
    - Name: ${eventName}
    - Date: ${eventDate}
    - Location: ${eventLocation}
    ${presentationTitle ? `- Your Presentation: ${presentationTitle}` : ""}
    ${presentationTime ? `- Scheduled Time: ${presentationTime}` : ""}
    
    ${additionalInfo ? `Additional Information: ${additionalInfo}` : ""}
    
    Please visit ${eventUrl} for more details about the event.
    
    If you have any questions, please contact the event organizer at ${organizerEmail}.
    
    We're looking forward to your presentation!
    
    Best regards,
    ${organizerName}
    Event Organizer
  `

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #4f46e5;">You're Confirmed as a Speaker!</h2>
      
      <p>Hello ${recipientName},</p>
      
      <p>Congratulations! Your application to speak at <strong>"${eventName}"</strong> has been approved.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Event Details</h3>
        <p><strong>Name:</strong> ${eventName}</p>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Location:</strong> ${eventLocation}</p>
        ${presentationTitle ? `<p><strong>Your Presentation:</strong> ${presentationTitle}</p>` : ""}
        ${presentationTime ? `<p><strong>Scheduled Time:</strong> ${presentationTime}</p>` : ""}
      </div>
      
      ${
        additionalInfo
          ? `
      <div style="margin: 20px 0;">
        <h3>Additional Information</h3>
        <p>${additionalInfo}</p>
      </div>
      `
          : ""
      }
      
      <p>
        <a href="${eventUrl}" style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Event Details
        </a>
      </p>
      
      <p>If you have any questions, please contact the event organizer at <a href="mailto:${organizerEmail}">${organizerEmail}</a>.</p>
      
      <p>We're looking forward to your presentation!</p>
      
      <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
        Best regards,<br>
        ${organizerName}<br>
        Event Organizer
      </p>
    </div>
  `

  return sendEmail({ to: recipientEmail, subject, text, html })
}

// Function to send approval notification to attendees
export async function sendAttendeeApprovalEmail({
  eventName,
  eventDate,
  eventLocation,
  recipientEmail,
  recipientName,
  eventId,
  eventSlug,
  organizerName,
  organizerEmail,
  ticketType,
  ticketId,
  additionalInfo,
}: {
  eventName: string
  eventDate: string
  eventLocation: string
  recipientEmail: string
  recipientName: string
  eventId: string
  eventSlug: string
  organizerName: string
  organizerEmail: string
  ticketType?: string
  ticketId?: string
  additionalInfo?: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const eventUrl = `${appUrl}/events/${eventSlug || eventId}`

  const subject = `Registration Confirmed for ${eventName}`

  const text = `
    Hello ${recipientName},
    
    Your registration for "${eventName}" has been confirmed!
    
    Event Details:
    - Name: ${eventName}
    - Date: ${eventDate}
    - Location: ${eventLocation}
    ${ticketType ? `- Ticket Type: ${ticketType}` : ""}
    ${ticketId ? `- Ticket ID: ${ticketId}` : ""}
    
    ${additionalInfo ? `Additional Information: ${additionalInfo}` : ""}
    
    Please visit ${eventUrl} for more details about the event.
    
    If you have any questions, please contact the event organizer at ${organizerEmail}.
    
    We look forward to seeing you at the event!
    
    Best regards,
    ${organizerName}
    Event Organizer
  `

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #4f46e5;">Your Registration is Confirmed!</h2>
      
      <p>Hello ${recipientName},</p>
      
      <p>Your registration for <strong>"${eventName}"</strong> has been confirmed!</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Event Details</h3>
        <p><strong>Name:</strong> ${eventName}</p>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Location:</strong> ${eventLocation}</p>
        ${ticketType ? `<p><strong>Ticket Type:</strong> ${ticketType}</p>` : ""}
        ${ticketId ? `<p><strong>Ticket ID:</strong> ${ticketId}</p>` : ""}
      </div>
      
      ${
        additionalInfo
          ? `
      <div style="margin: 20px 0;">
        <h3>Additional Information</h3>
        <p>${additionalInfo}</p>
      </div>
      `
          : ""
      }
      
      <p>
        <a href="${eventUrl}" style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Event Details
        </a>
      </p>
      
      <p>If you have any questions, please contact the event organizer at <a href="mailto:${organizerEmail}">${organizerEmail}</a>.</p>
      
      <p>We look forward to seeing you at the event!</p>
      
      <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
        Best regards,<br>
        ${organizerName}<br>
        Event Organizer
      </p>
    </div>
  `

  return sendEmail({ to: recipientEmail, subject, text, html })
}

// Add a function to send rejection notification to attendees
export async function sendAttendeeRejectionEmail({
  eventName,
  eventDate,
  eventLocation,
  recipientEmail,
  recipientName,
  eventId,
  eventSlug,
  organizerName,
  organizerEmail,
  additionalInfo,
}: {
  eventName: string
  eventDate: string
  eventLocation: string
  recipientEmail: string
  recipientName: string
  eventId: string
  eventSlug: string
  organizerName: string
  organizerEmail: string
  additionalInfo?: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const eventUrl = `${appUrl}/events/${eventSlug || eventId}`

  const subject = `Update Regarding Your Registration for ${eventName}`

  const text = `
    Hello ${recipientName},
    
    Thank you for your interest in "${eventName}".
    
    Unfortunately, we are unable to confirm your registration at this time.
    
    Event Details:
    - Name: ${eventName}
    - Date: ${eventDate}
    - Location: ${eventLocation}
    
    ${additionalInfo ? `Additional Information: ${additionalInfo}` : ""}
    
    Please visit ${eventUrl} for more information about the event.
    
    If you have any questions, please contact the event organizer at ${organizerEmail}.
    
    Best regards,
    ${organizerName}
    Event Organizer
  `

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #4f46e5;">Registration Update</h2>
      
      <p>Hello ${recipientName},</p>
      
      <p>Thank you for your interest in <strong>"${eventName}"</strong>.</p>
      
      <p>Unfortunately, we are unable to confirm your registration at this time.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Event Details</h3>
        <p><strong>Name:</strong> ${eventName}</p>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Location:</strong> ${eventLocation}</p>
      </div>
      
      ${
        additionalInfo
          ? `
      <div style="margin: 20px 0;">
        <h3>Additional Information</h3>
        <p>${additionalInfo}</p>
      </div>
      `
          : ""
      }
      
      <p>
        <a href="${eventUrl}" style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Event Details
        </a>
      </p>
      
      <p>If you have any questions, please contact the event organizer at <a href="mailto:${organizerEmail}">${organizerEmail}</a>.</p>
      
      <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
        Best regards,<br>
        ${organizerName}<br>
        Event Organizer
      </p>
    </div>
  `

  return sendEmail({ to: recipientEmail, subject, text, html })
}

// Similarly, add functions for volunteer and speaker rejections
export async function sendVolunteerRejectionEmail({
  eventName,
  eventDate,
  eventLocation,
  recipientEmail,
  recipientName,
  eventId,
  eventSlug,
  organizerName,
  organizerEmail,
  additionalInfo,
}: {
  eventName: string
  eventDate: string
  eventLocation: string
  recipientEmail: string
  recipientName: string
  eventId: string
  eventSlug: string
  organizerName: string
  organizerEmail: string
  additionalInfo?: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const eventUrl = `${appUrl}/events/${eventSlug || eventId}`

  const subject = `Update Regarding Your Volunteer Application for ${eventName}`

  const text = `
    Hello ${recipientName},
    
    Thank you for your interest in volunteering for "${eventName}".
    
    After careful consideration, we regret to inform you that we are unable to accept your volunteer application at this time.
    
    Event Details:
    - Name: ${eventName}
    - Date: ${eventDate}
    - Location: ${eventLocation}
    
    ${additionalInfo ? `Additional Information: ${additionalInfo}` : ""}
    
    Please visit ${eventUrl} for more information about the event.
    
    If you have any questions, please contact the event organizer at ${organizerEmail}.
    
    Best regards,
    ${organizerName}
    Event Organizer
  `

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #4f46e5;">Volunteer Application Update</h2>
      
      <p>Hello ${recipientName},</p>
      
      <p>Thank you for your interest in volunteering for <strong>"${eventName}"</strong>.</p>
      
      <p>After careful consideration, we regret to inform you that we are unable to accept your volunteer application at this time.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Event Details</h3>
        <p><strong>Name:</strong> ${eventName}</p>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Location:</strong> ${eventLocation}</p>
      </div>
      
      ${
        additionalInfo
          ? `
      <div style="margin: 20px 0;">
        <h3>Additional Information</h3>
        <p>${additionalInfo}</p>
      </div>
      `
          : ""
      }
      
      <p>
        <a href="${eventUrl}" style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Event Details
        </a>
      </p>
      
      <p>If you have any questions, please contact the event organizer at <a href="mailto:${organizerEmail}">${organizerEmail}</a>.</p>
      
      <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
        Best regards,<br>
        ${organizerName}<br>
        Event Organizer
      </p>
    </div>
  `

  return sendEmail({ to: recipientEmail, subject, text, html })
}

export async function sendSpeakerRejectionEmail({
  eventName,
  eventDate,
  eventLocation,
  recipientEmail,
  recipientName,
  eventId,
  eventSlug,
  organizerName,
  organizerEmail,
  additionalInfo,
}: {
  eventName: string
  eventDate: string
  eventLocation: string
  recipientEmail: string
  recipientName: string
  eventId: string
  eventSlug: string
  organizerName: string
  organizerEmail: string
  additionalInfo?: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const eventUrl = `${appUrl}/events/${eventSlug || eventId}`

  const subject = `Update Regarding Your Speaker Application for ${eventName}`

  const text = `
    Hello ${recipientName},
    
    Thank you for your interest in speaking at "${eventName}".
    
    After careful consideration, we regret to inform you that we are unable to accept your speaker application at this time.
    
    Event Details:
    - Name: ${eventName}
    - Date: ${eventDate}
    - Location: ${eventLocation}
    
    ${additionalInfo ? `Additional Information: ${additionalInfo}` : ""}
    
    Please visit ${eventUrl} for more information about the event.
    
    If you have any questions, please contact the event organizer at ${organizerEmail}.
    
    Best regards,
    ${organizerName}
    Event Organizer
  `

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #4f46e5;">Speaker Application Update</h2>
      
      <p>Hello ${recipientName},</p>
      
      <p>Thank you for your interest in speaking at <strong>"${eventName}"</strong>.</p>
      
      <p>After careful consideration, we regret to inform you that we are unable to accept your speaker application at this time.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Event Details</h3>
        <p><strong>Name:</strong> ${eventName}</p>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Location:</strong> ${eventLocation}</p>
      </div>
      
      ${
        additionalInfo
          ? `
      <div style="margin: 20px 0;">
        <h3>Additional Information</h3>
        <p>${additionalInfo}</p>
      </div>
      `
          : ""
      }
      
      <p>
        <a href="${eventUrl}" style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Event Details
        </a>
      </p>
      
      <p>If you have any questions, please contact the event organizer at <a href="mailto:${organizerEmail}">${organizerEmail}</a>.</p>
      
      <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
        Best regards,<br>
        ${organizerName}<br>
        Event Organizer
      </p>
    </div>
  `

  return sendEmail({ to: recipientEmail, subject, text, html })
}
