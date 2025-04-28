import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendRegistrationApprovalEmail } from "@/lib/email-service"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { registrationIds } = await req.json()

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ error: "Registration IDs are required" }, { status: 400 })
    }

    // Get the event details for the email
    const event = await db.collection("events").findOne({ _id: new ObjectId(params.id) })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Convert string IDs to ObjectIds
    const objectIds = registrationIds.map((id) => new ObjectId(id))

    // Find all the registrations to be approved
    const registrations = await db
      .collection("formsubmissions")
      .find({ _id: { $in: objectIds }, eventId: new ObjectId(params.id) })
      .toArray()

    if (registrations.length === 0) {
      return NextResponse.json({ error: "No matching registrations found" }, { status: 404 })
    }

    // Update all registrations to approved status
    await db
      .collection("formsubmissions")
      .updateMany({ _id: { $in: objectIds } }, { $set: { status: "approved", updatedAt: new Date() } })

    // Send email notifications
    const emailResults = await Promise.all(
      registrations.map(async (registration) => {
        try {
          // Extract attendee information for email notification
          const formData = registration.data || {}

          // Extract email from any available email field
          const attendeeEmail =
            formData.email ||
            formData.corporateEmail ||
            formData.userEmail ||
            formData.emailAddress ||
            registration.userEmail ||
            null

          // Extract name from any available name field
          const firstName = formData.firstName || formData.first_name || ""
          const lastName = formData.lastName || formData.last_name || ""
          const fullName = formData.name || formData.fullName || ""

          // Construct attendee name from available fields
          const attendeeName =
            fullName || (firstName && lastName ? `${firstName} ${lastName}` : firstName) || "Attendee"

          if (!attendeeEmail) {
            console.warn(`No email found for registration ${registration._id}`)
            return { id: registration._id.toString(), success: false, reason: "No email address found" }
          }

          console.log(`Sending approval email to ${attendeeEmail} for registration ${registration._id}`)

          const emailSent = await sendRegistrationApprovalEmail({
            eventName: event.title,
            attendeeEmail,
            attendeeName,
            eventDetails: event,
            eventId: params.id,
          })

          return {
            id: registration._id.toString(),
            success: emailSent,
            email: attendeeEmail,
            name: attendeeName,
          }
        } catch (error) {
          console.error(`Error sending email for registration ${registration._id}:`, error)
          return {
            id: registration._id.toString(),
            success: false,
            reason: error instanceof Error ? error.message : "Unknown error",
          }
        }
      }),
    )

    const successCount = emailResults.filter((result) => result.success).length

    return NextResponse.json({
      success: true,
      message: `${registrations.length} registrations approved, ${successCount} email notifications sent`,
      emailResults,
    })
  } catch (error) {
    console.error("Error bulk approving registrations:", error)
    return NextResponse.json({ error: "An error occurred while bulk approving registrations" }, { status: 500 })
  }
}
