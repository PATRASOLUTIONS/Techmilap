import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email-service"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { to, subject, html, text, registrationIds, attendeeData, message, includeEventDetails } = await req.json()

    // Get the event details
    const event = await db.collection("events").findOne({ _id: new ObjectId(params.id) })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // If sending to specific registrations
    if (registrationIds && Array.isArray(registrationIds)) {
      const results = []
      const successfulEmails = []
      const failedEmails = []

      // Get all registrations
      const registrations = await db
        .collection("formsubmissions")
        .find({
          _id: { $in: registrationIds.map((id) => new ObjectId(id)) },
          eventId: new ObjectId(params.id),
        })
        .toArray()

      // Process each registration for email notification
      for (const registration of registrations) {
        try {
          // Find attendee data if provided
          const attendee = attendeeData?.find((a) => a.id === registration._id.toString())

          // Extract email and name from registration or provided attendee data
          const formData = registration.data || {}

          const email =
            attendee?.email ||
            formData.email ||
            formData.corporateEmail ||
            formData.userEmail ||
            formData.emailAddress ||
            formData.email_address ||
            formData.corporate_email ||
            formData.user_email ||
            formData.Email ||
            formData.CorporateEmail ||
            formData.UserEmail ||
            formData.EmailAddress ||
            registration.userEmail

          const name =
            attendee?.name ||
            formData.name ||
            formData.fullName ||
            formData.full_name ||
            formData.Name ||
            formData.FullName ||
            ((formData.firstName || formData.first_name || formData.FirstName) &&
            (formData.lastName || formData.last_name || formData.LastName)
              ? `${formData.firstName || formData.first_name || formData.FirstName} ${
                  formData.lastName || formData.last_name || formData.LastName
                }`
              : formData.firstName || formData.first_name || formData.FirstName) ||
            registration.userName ||
            "Attendee"

          if (email) {
            console.log(`Sending email to ${name} (${email})`)

            // Personalize the message with the recipient's name
            let personalizedMessage = message
            if (message.includes("{name}")) {
              personalizedMessage = message.replace(/{name}/g, name)
            }

            // Build the email content
            let emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
                <h2 style="color: #4f46e5;">${subject}</h2>
                <p>Hello ${name},</p>
                <div style="margin: 20px 0;">
                  ${personalizedMessage.replace(/\n/g, "<br>")}
                </div>
            `

            // Add event details if requested
            if (includeEventDetails) {
              emailHtml += `
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Event Details</h3>
                  <p><strong>Event:</strong> ${event.title}</p>
                  <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                  <p><strong>Location:</strong> ${event.location || "TBD"}</p>
                  ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ""}
                </div>
              `
            }

            // Close the email
            emailHtml += `
                <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
                  Best regards,<br>
                  The Event Team
                </p>
              </div>
            `

            // Create plain text version
            let emailText = `Hello ${name},\n\n${personalizedMessage}\n\n`

            if (includeEventDetails) {
              emailText += `
                Event Details:
                - Event: ${event.title}
                - Date: ${new Date(event.date).toLocaleDateString()}
                - Location: ${event.location || "TBD"}
                ${event.description ? `- Description: ${event.description}` : ""}
              `
            }

            emailText += `\n\nBest regards,\nThe Event Team`

            const emailSent = await sendEmail({
              to: email,
              subject: subject,
              html: emailHtml,
              text: emailText,
            })

            if (emailSent) {
              successfulEmails.push(email)
              results.push({ id: registration._id.toString(), email, name, success: true })
            } else {
              failedEmails.push(email)
              results.push({ id: registration._id.toString(), email, name, success: false })
            }
          } else {
            console.warn(`No email found for registration ${registration._id}`)
            results.push({ id: registration._id.toString(), success: false, reason: "No email address found" })
          }
        } catch (error) {
          console.error(`Error sending email for registration ${registration._id}:`, error)
          results.push({
            id: registration._id.toString(),
            success: false,
            reason: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: `Emails sent to ${successfulEmails.length} out of ${registrationIds.length} recipients`,
        results: {
          total: results.length,
          successful: successfulEmails.length,
          failed: failedEmails.length,
          details: results,
        },
      })
    }
    // If sending to a specific email address
    else if (to) {
      const emailSent = await sendEmail({
        to,
        subject,
        html,
        text,
      })

      return NextResponse.json({
        success: emailSent,
        message: emailSent ? "Email sent successfully" : "Failed to send email",
      })
    } else {
      return NextResponse.json({ error: "No recipients specified" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: "An error occurred while sending the email" }, { status: 500 })
  }
}
