import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendRegistrationApprovalEmail } from "@/lib/email-service"
import User from "@/models/User"
import FormSubmission from "@/models/FormSubmission"
import { logWithTimestamp } from "@/utils/logger"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { registrationIds, attendeeData } = await req.json()

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ error: "Registration IDs are required" }, { status: 400 })
    }

    // Get the event details for the email
    const event = await db.collection("events").findOne({ _id: new ObjectId(params.id) })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Get the organizer's email
    let organizerEmail = null
    if (event.organizerId) {
      try {
        const organizer = await User.findById(event.organizerId)
        if (organizer && organizer.email) {
          organizerEmail = organizer.email
          console.log(`Found organizer email: ${organizerEmail}`)
        } else {
          console.log("Organizer found but no email available")
        }
      } catch (error) {
        console.error("Error fetching organizer:", error)
      }
    } else {
      console.log("No organizerId found in event")
    }

    logWithTimestamp("info", "Organizer Email", organizerEmail)

    // Update all registrations to approved status
    const updateResult = await FormSubmission.updateMany(
      {
        _id: { $in: registrationIds.map((id) => new ObjectId(id)) },
        eventId: new ObjectId(params.id),
      },
      {
        $set: {
          status: "approved",
          updatedAt: new Date(),
        },
      },
    )

    // Send email notifications to all approved attendees
    const emailResults = []
    const successfulEmails = []
    const failedEmails = []

    // Get all registrations that were updated
    const updatedRegistrations = await db
      .collection("formsubmissions")
      .find({
        _id: { $in: registrationIds.map((id) => new ObjectId(id)) },
        eventId: new ObjectId(params.id),
      })
      .toArray()

    // Process each registration for email notification
    for (const registration of updatedRegistrations) {
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
            ? `${formData.firstName || formData.first_name || formData.FirstName} ${formData.lastName || formData.last_name || formData.LastName
            }`
            : formData.firstName || formData.first_name || formData.FirstName) ||
          registration.userName ||
          "Attendee"

        if (email) {
          console.log(`Sending approval email to ${name} (${email})`)

          const emailSent = await sendRegistrationApprovalEmail({
            eventName: event.title,
            attendeeEmail: email,
            attendeeName: name,
            eventDetails: event,
            eventId: params.id,
            organizerEmail: organizerEmail, // Pass the organizer email
          })

          if (emailSent) {
            successfulEmails.push(email)
            emailResults.push({ id: registration._id.toString(), email, name, success: true })
          } else {
            failedEmails.push(email)
            emailResults.push({ id: registration._id.toString(), email, name, success: false })
          }
        } else {
          console.warn(`No email found for registration ${registration._id}`)
          emailResults.push({ id: registration._id.toString(), success: false, reason: "No email address found" })
        }
      } catch (error) {
        console.error(`Error sending email for registration ${registration._id}:`, error)
        emailResults.push({
          id: registration._id.toString(),
          success: false,
          reason: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `${updateResult.modifiedCount} registrations approved`,
      emailResults: {
        total: emailResults.length,
        successful: successfulEmails.length,
        failed: failedEmails.length,
        details: emailResults,
      },
      organizerEmailSent: organizerEmail ? true : false,
    })
  } catch (error) {
    console.error("Error bulk approving registrations:", error)
    return NextResponse.json({ error: "An error occurred while bulk approving registrations" }, { status: 500 })
  }
}
