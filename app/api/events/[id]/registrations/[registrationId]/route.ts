import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendRegistrationApprovalEmail, sendRegistrationRejectionEmail } from "@/lib/email-service"

export async function PATCH(req: NextRequest, { params }: { params: { id: string; registrationId: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { status, attendeeEmail, attendeeName } = await req.json()

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Find the registration
    const registration = await db.collection("formsubmissions").findOne({
      _id: new ObjectId(params.registrationId),
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Update the registration status
    await db
      .collection("formsubmissions")
      .updateOne({ _id: new ObjectId(params.registrationId) }, { $set: { status, updatedAt: new Date() } })

    // Get the event details for the email
    const event = await db.collection("events").findOne({ _id: new ObjectId(params.id) })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

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
        ? `${formData.firstName || formData.first_name || formData.FirstName} ${
            formData.lastName || formData.last_name || formData.LastName
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
          emailSent = await sendRegistrationApprovalEmail({
            eventName: event.title,
            attendeeEmail: finalEmail,
            attendeeName: finalName,
            eventDetails: event,
            eventId: params.id,
          })
        } else if (status === "rejected") {
          console.log(`Sending rejection email to ${finalEmail}`)
          emailSent = await sendRegistrationRejectionEmail({
            eventName: event.title,
            attendeeEmail: finalEmail,
            attendeeName: finalName,
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
    })
  } catch (error) {
    console.error("Error updating registration status:", error)
    return NextResponse.json({ error: "An error occurred while updating registration status" }, { status: 500 })
  }
}
