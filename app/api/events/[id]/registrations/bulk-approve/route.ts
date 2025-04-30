import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendRegistrationApprovalEmail } from "@/lib/email-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { registrationIds } = await request.json()

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ error: "Invalid registration IDs" }, { status: 400 })
    }

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

    // Convert string IDs to ObjectIds
    const objectIds = registrationIds.map((id) => new ObjectId(id))

    // Update all registrations
    const result = await db.collection("registrations").updateMany(
      {
        _id: { $in: objectIds },
        eventId: new ObjectId(id),
      },
      { $set: { status: "approved", updatedAt: new Date() } },
    )

    // Get the organizer's email
    const organizer = await db.collection("users").findOne({
      _id: new ObjectId(event.organizerId),
    })

    const organizerEmail = organizer?.email

    // Send email notifications
    const registrations = await db
      .collection("registrations")
      .find({
        _id: { $in: objectIds },
        eventId: new ObjectId(id),
      })
      .toArray()

    for (const registration of registrations) {
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
    }

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
    })
  } catch (error) {
    console.error("Error bulk approving registrations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
