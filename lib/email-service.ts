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

// Function to send contact form submission
export async function sendContactFormEmail({ name, email, message }) {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: `"TechEventPlanner Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "New Contact Form Submission",
      text: `You have a new contact form submission:
      Name: ${name}
      Email: ${email}
      Message: ${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Contact Form Submission</h2>
          <p>You have a new contact form submission:</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong> ${message}</p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Contact form email sent to ${process.env.EMAIL_USER}`)
    return true
  } catch (error) {
    console.error(`Error sending contact form email to ${process.env.EMAIL_USER}:`, error)
    return false
  }
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
}) {
  try {
    const transporter = createTransporter()

    // Format submission data for display in email
    const submissionDetails = Object.entries(submissionData)
      .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
      .join("")

    const mailOptions = {
      from: `"TechEventPlanner" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `New ${formType} submission for ${eventName}`,
      text: `You have a new ${formType} submission for ${eventName}.
      Submission Details:
      ${Object.entries(submissionData)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n")}
      View submission: ${process.env.NEXT_PUBLIC_APP_URL}/event-dashboard/${eventId}/submissions/${formType}/${submissionId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New ${formType} submission for ${eventName}</h2>
          <p>You have a new ${formType} submission for ${eventName}.</p>
          <h3>Submission Details:</h3>
          ${submissionDetails}
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/event-dashboard/${eventId}/submissions/${formType}/${submissionId}">View submission</a></p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Form submission notification sent to ${recipientEmail}`)
    return true
  } catch (error) {
    console.error(`Error sending form submission notification to ${recipientEmail}:`, error)
    return false
  }
}
