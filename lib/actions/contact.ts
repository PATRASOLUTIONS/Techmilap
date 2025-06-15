"use server"

import { sendEmail } from "@/lib/email-service"
import { z } from "zod"

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

export type ContactFormData = z.infer<typeof contactFormSchema>

export async function submitContactForm(formData: FormData) {
  try {
    // Extract form data
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const subject = formData.get("subject") as string
    const message = formData.get("message") as string

    // Validate input
    const result = contactFormSchema.safeParse({
      name,
      email,
      subject,
      message,
    })

    if (!result.success) {
      return {
        success: false,
        message: "Invalid form data. Please check your inputs and try again.",
        errors: result.error.flatten().fieldErrors,
      }
    }

    // Send email to the company
    const companyEmailSent = await sendEmail({
      to: process.env.EMAIL_USER || "contact@techmilap.com",
      subject: `Contact Form: ${subject}`,
      text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <h3>Message:</h3>
          <p>${message.replace(/\n/g, "<br>")}</p>
        </div>
      `,
    })

    // Send confirmation email to the user
    const userEmailSent = await sendEmail({
      to: email,
      subject: `Thank you for contacting Tech Milap`,
      text: `
Dear ${name},

Thank you for contacting Tech Milap. We have received your message regarding "${subject}".

Our team will review your inquiry and get back to you as soon as possible. We typically respond within 24-48 business hours.

For your reference, here's a copy of your message:

${message}

Thank you for your patience.

Best regards,
Tech Milap Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #4f46e5;">Thank You for Contacting Us</h2>
          <p>Dear ${name},</p>
          <p>Thank you for contacting Tech Milap. We have received your message regarding "${subject}".</p>
          <p>Our team will review your inquiry and get back to you as soon as possible. We typically respond within 24-48 business hours.</p>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Message:</h3>
            <p>${message.replace(/\n/g, "<br>")}</p>
          </div>
          <p>Thank you for your patience.</p>
          <p>Best regards,<br>Tech Milap Team</p>
        </div>
      `,
    })

    if (!companyEmailSent || !userEmailSent) {
      return {
        success: false,
        message: "There was an error sending your message. Please try again later.",
      }
    }

    return {
      success: true,
      message: "Your message has been sent successfully! We'll get back to you soon.",
    }
  } catch (error) {
    console.error("Error submitting contact form:", error)
    return {
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    }
  }
}
