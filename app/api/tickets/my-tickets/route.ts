import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const userId = new ObjectId(session.user.id)

    // Get all registrations for the user
    const registrations = await db.collection("registrations").find({ userId, status: "approved" }).toArray()

    // Get all volunteer applications for the user
    const volunteerApplications = await db
      .collection("volunteerApplications")
      .find({ userId, status: "approved" })
      .toArray()

    // Get all speaker applications for the user
    const speakerApplications = await db
      .collection("speakerApplications")
      .find({ userId, status: "approved" })
      .toArray()

    // Get event details for all registrations, volunteer applications, and speaker applications
    const eventIds = [
      ...registrations.map((reg) => new ObjectId(reg.eventId)),
      ...volunteerApplications.map((app) => new ObjectId(app.eventId)),
      ...speakerApplications.map((app) => new ObjectId(app.eventId)),
    ]

    const events =
      eventIds.length > 0
        ? await db
            .collection("events")
            .find({ _id: { $in: eventIds } })
            .toArray()
        : []

    // Create tickets from registrations, volunteer applications, and speaker applications
    const tickets = [
      ...registrations.map((reg) => {
        const event = events.find((e) => e._id.toString() === reg.eventId.toString())
        return {
          _id: reg._id,
          eventId: reg.eventId,
          title: event?.title || "Unknown Event",
          date: event?.date || null,
          endDate: event?.endDate || null,
          startTime: event?.startTime || null,
          endTime: event?.endTime || null,
          venue: event?.venue || null,
          location: event?.location || null,
          image: event?.image || null,
          ticketType: "attendee",
          price: event?.price || 0,
          createdAt: reg.createdAt,
          status: "confirmed",
        }
      }),
      ...volunteerApplications.map((app) => {
        const event = events.find((e) => e._id.toString() === app.eventId.toString())
        return {
          _id: app._id,
          eventId: app.eventId,
          title: event?.title || "Unknown Event",
          date: event?.date || null,
          endDate: event?.endDate || null,
          startTime: event?.startTime || null,
          endTime: event?.endTime || null,
          venue: event?.venue || null,
          location: event?.location || null,
          image: event?.image || null,
          ticketType: "volunteer",
          price: 0, // Volunteers typically don't pay
          createdAt: app.createdAt,
          status: "confirmed",
        }
      }),
      ...speakerApplications.map((app) => {
        const event = events.find((e) => e._id.toString() === app.eventId.toString())
        return {
          _id: app._id,
          eventId: app.eventId,
          title: event?.title || "Unknown Event",
          date: event?.date || null,
          endDate: event?.endDate || null,
          startTime: event?.startTime || null,
          endTime: event?.endTime || null,
          venue: event?.venue || null,
          location: event?.location || null,
          image: event?.image || null,
          ticketType: "speaker",
          price: 0, // Speakers typically don't pay
          createdAt: app.createdAt,
          status: "confirmed",
        }
      }),
    ]

    // Sort tickets by date (most recent first)
    tickets.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0)
      const dateB = b.date ? new Date(b.date) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}
