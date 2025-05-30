import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { sendRegistrationApprovalEmail, sendRegistrationRejectionEmail } from "@/lib/email-service"
import Event from "@/models/Event"
import FormSubmission from "@/models/FormSubmission"
import User from "@/models/User"
import { logWithTimestamp } from "@/utils/logger"

export async function PATCH(req: NextRequest, { params }: { params: { id: string; registrationId: string } }) {
  try {
    await connectToDatabase()
    const { status, attendeeEmail, attendeeName } = await req.json()

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Find the registration
    const registration = await FormSubmission.findById(params.registrationId)

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Update the registration status
    if (registration) {
      registration.status = status
      registration.updatedAt = new Date()
      await registration.save()
    }

    // Get the event details for the email
    const event = await Event.findById(params.id).lean()

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    logWithTimestamp("info", "Event Details", event)

    const users = await User.find({}); // An empty query {} fetches all documents

    logWithTimestamp("info", "Users", users);


    // Get the organizer's email
    let organizerEmail = null
    let organizerUser = null
    if (event.organizer) {
      try {
        organizerUser = await User.findById(event.organizer)
        if (organizerUser && organizerUser.email) {
          organizerEmail = organizerUser.email
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



    //log organizer email
    logWithTimestamp("info", `Organizer Email: ${organizerEmail}`)

    // return

    // Extract attendee information for email notification
    // Check multiple possible email fields in the form data
    const formData = registration.data || {}

    // Use provided attendeeEmail if available, otherwise extract from form data
    const finalEmail =
      attendeeEmail ||
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
      registration.userEmail ||
      null

    console.log("Available email fields:", {
      providedEmail: attendeeEmail,
      dataEmail: formData.email,
      dataCorporateEmail: formData.corporateEmail,
      dataUserEmail: formData.userEmail,
      dataEmailAddress: formData.emailAddress,
      registrationUserEmail: registration.userEmail,
      finalEmail: finalEmail,
      organizerEmail: organizerEmail,
    })

    // Use provided attendeeName if available, otherwise extract from form data
    const finalName =
      attendeeName ||
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

    console.log(`Extracted attendee info - Name: ${finalName}, Email: ${finalEmail}`)

    let emailSent = false

    // Send email notification based on status
    if (finalEmail) {
      try {
        if (status === "approved") {
          console.log(`Sending approval email to ${finalEmail}`)

          // Enhanced event details for the email
          const enhancedEventDetails = {
            ...event,
            organizer: event.organizer,
            organizerName: organizerUser?.name || "Event Organizer",
            attendeeId: registration._id.toString(),
          }

          emailSent = await sendRegistrationApprovalEmail({
            eventName: event.title,
            attendeeEmail: finalEmail,
            attendeeName: finalName,
            eventDetails: enhancedEventDetails,
            eventId: params.id,
            organizerEmail: organizerEmail,
            organizerId: event.organizer // Pass the organizer email
          })
        } else if (status === "rejected") {
          console.log(`Sending rejection email to ${finalEmail}`)

          // Enhanced event details for the email
          const enhancedEventDetails = {
            ...event,
            organizer: event.organizerId,
            organizerName: organizerUser?.name || "Event Organizer",
            attendeeId: registration._id.toString(),
          }

          emailSent = await sendRegistrationRejectionEmail({
            eventName: event.title,
            attendeeEmail: finalEmail,
            attendeeName: finalName,
            eventId: params.id,
            eventDetails: enhancedEventDetails,
            organizerEmail: organizerEmail,
            organizerId: event.organizer // Pass the organizer email
          })
        }

        console.log(`Email notification ${emailSent ? "sent successfully" : "failed to send"}`)
      } catch (emailError) {
        console.error("Error sending email notification:", emailError)
      }
    } else {
      console.warn("No email address found for attendee, skipping notification")
    }

    return NextResponse.json({
      success: true,
      message: `Registration status updated to ${status}`,
      emailSent,
      organizerEmailSent: organizerEmail ? emailSent : false,
    })
  } catch (error) {
    console.error("Error updating registration status:", error)
    return NextResponse.json({ error: "An error occurred while updating registration status" }, { status: 500 })
  }
}
