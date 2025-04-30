import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendRegistrationApprovalEmail, sendRegistrationRejectionEmail } from "@/lib/email-service"

export async function PUT(request: NextRequest, { params }: { params: { id: string; registrationId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, registrationId } = params
    const { status, rejectionReason } = await request.json()

    const { db } = await connectToDatabase()

    // Get the event to check if the user is the organizer
    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer of the event
    if (event.organizerId.toString() !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the registration
    const registration = await db.collection("registrations").findOne({
      _id: new ObjectId(registrationId),
      eventId: new ObjectId(id),
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Update the registration status
    const result = await db
      .collection("registrations")
      .updateOne({ _id: new ObjectId(registrationId) }, { $set: { status, updatedAt: new Date() } })

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update registration" }, { status: 500 })
    }

    // Get the organizer's email
    const organizer = await db.collection("users").findOne({
      _id: new ObjectId(event.organizerId),
    })

    const organizerEmail = organizer?.email

    // Send email notification based on status
    if (status === "approved") {
      // Get the attendee's name and email
      const attendee = await db.collection("users").findOne({
        _id: new ObjectId(registration.userId),
      })

      if (attendee) {
        await sendRegistrationApprovalEmail({
          eventName: event.title,
          attendeeEmail: attendee.email,
          attendeeName: attendee.name || attendee.email,
          eventDetails: event,
          eventId: id,
          organizerEmail: organizerEmail, // Pass the organizer's email
        })
      }
    } else if (status === "rejected") {
      // Get the attendee's name and email
      const attendee = await db.collection("users").findOne({
        _id: new ObjectId(registration.userId),
      })

      if (attendee) {
        await sendRegistrationRejectionEmail({
          eventName: event.title,
          attendeeEmail: attendee.email,
          attendeeName: attendee.name || attendee.email,
          rejectionReason,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating registration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
