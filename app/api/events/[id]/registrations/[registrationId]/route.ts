import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendRegistrationApprovalEmail, sendRegistrationRejectionEmail } from "@/lib/email-service"

export async function PATCH(req: NextRequest, { params }: { params: { id: string; registrationId: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { status } = await req.json()

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Find the registration
    const registration = await db.collection("formsubmissions").findOne({
      _id: new ObjectId(params.registrationId),
      eventId: new ObjectId(params.id),
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

    // Extract email from any available email field
    const attendeeEmail =
      formData.email ||
      formData.corporateEmail ||
      formData.userEmail ||
      formData.emailAddress ||
      registration.userEmail ||
      null

    console.log("Available email fields:", {
      dataEmail: formData.email,
      dataCorporateEmail: formData.corporateEmail,
      dataUserEmail: formData.userEmail,
      dataEmailAddress: formData.emailAddress,
      registrationUserEmail: registration.userEmail,
    })

    // Extract name from any available name field
    const firstName = formData.firstName || formData.first_name || ""
    const lastName = formData.lastName || formData.last_name || ""
    const fullName = formData.name || formData.fullName || ""

    // Construct attendee name from available fields
    const attendeeName = fullName || (firstName && lastName ? `${firstName} ${lastName}` : firstName) || "Attendee"

    console.log(`Extracted attendee info - Name: ${attendeeName}, Email: ${attendeeEmail}`)

    let emailSent = false

    // Send email notification based on status
    if (attendeeEmail) {
      try {
        if (status === "approved") {
          console.log(`Sending approval email to ${attendeeEmail}`)
          emailSent = await sendRegistrationApprovalEmail({
            eventName: event.title,
            attendeeEmail,
            attendeeName,
            eventDetails: event,
            eventId: params.id,
          })
        } else if (status === "rejected") {
          console.log(`Sending rejection email to ${attendeeEmail}`)
          emailSent = await sendRegistrationRejectionEmail({
            eventName: event.title,
            attendeeEmail,
            attendeeName,
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
