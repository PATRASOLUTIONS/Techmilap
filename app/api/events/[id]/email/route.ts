import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { ObjectId } from "mongodb"
import { sendEmail } from "@/lib/email-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = params.id
    const { registrationIds, subject, message } = await request.json()

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ error: "Invalid registration IDs" }, { status: 400 })
    }

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 })
    }

    // Connect to the database
    await connectToDatabase()

    // Get the MongoDB connection
    const db = mongoose.connection

    // Get the registrations collection
    const registrationsCollection = db.collection("formsubmissions")

    // Get the events collection
    const eventsCollection = db.collection("events")

    // Convert string IDs to ObjectIds
    const objectIds = registrationIds.map((id) => new ObjectId(id))

    // Get the registrations
    const registrations = await registrationsCollection
      .find({
        _id: { $in: objectIds },
        eventId: eventId,
      })
      .toArray()

    // Get the event
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Send emails
    const emailPromises = registrations.map(async (registration) => {
      // Get email from registration
      const email =
        registration.email || registration.data?.email || registration.userEmail || registration.data?.userEmail

      if (!email) {
        return { success: false, id: registration._id, error: "No email found" }
      }

      // Get name from registration
      const name =
        registration.name ||
        registration.data?.name ||
        registration.userName ||
        registration.data?.userName ||
        "Attendee"

      // Personalize message
      const personalizedMessage = message.replace(/{name}/g, name)

      // Send email
      try {
        await sendEmail({
          to: email,
          subject: subject,
          html: `
            <div>
              <p>Hello ${name},</p>
              <div>${personalizedMessage}</div>
              <p>Regards,<br>${event.organizerName || "Event Organizer"}</p>
            </div>
          `,
        })

        return { success: true, id: registration._id }
      } catch (error) {
        console.error(`Error sending email to ${email}:`, error)
        return { success: false, id: registration._id, error: "Failed to send email" }
      }
    })

    const results = await Promise.allSettled(emailPromises)

    const successful = results.filter((r) => r.status === "fulfilled" && r.value.success).length

    // Return success
    return NextResponse.json({
      success: true,
      message: `${successful} out of ${registrations.length} emails sent successfully`,
      results: results.map((r) => (r.status === "fulfilled" ? r.value : { success: false, error: r.reason })),
    })
  } catch (error) {
    console.error("Error sending emails:", error)
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 })
  }
}
