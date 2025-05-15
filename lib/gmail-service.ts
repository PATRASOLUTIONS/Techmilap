import nodemailer from "nodemailer"

// Create a transporter using Gmail SMTP with environment variables
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number.parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  })

  return transporter
}

// Function to send an email
export async function sendGmailEmail({
  to,
  subject,
  text,
  html,
  from = `TechMilap <${process.env.EMAIL_USER}>`,
  attachments = [],
}: {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  from?: string
  attachments?: any[]
}) {
  try {
    // Validate email address format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    // If 'to' is an array, validate each email
    if (Array.isArray(to)) {
      for (const email of to) {
        if (!emailRegex.test(email)) {
          console.error(`Invalid email address format: ${email}`)
          return { success: false, error: `Invalid email address format: ${email}` }
        }
      }
    } else if (!emailRegex.test(to)) {
      console.error(`Invalid email address format: ${to}`)
      return { success: false, error: `Invalid email address format: ${to}` }
    }

    // Create the transporter
    const transporter = createTransporter()

    // Send the email
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
      attachments,
    })

    console.log(`Email sent successfully: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Function to verify SMTP connection
export async function verifyGmailConnection() {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    return { success: true, message: "SMTP connection verified successfully" }
  } catch (error) {
    console.error("SMTP verification failed:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
