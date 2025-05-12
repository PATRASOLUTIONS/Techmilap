import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import FormSubmission from "@/models/FormSubmission"
import Event from "@/models/Event"

export async function GET() {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Get the user's ID
    const userId = session.user.id

    // Find all form submissions for this user
    const formSubmissions = await FormSubmission.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: "approved",
    }).lean()

    // Get event IDs from form submissions
    const eventIds = formSubmissions.map((submission) => submission.eventId)

    // Find events for these submissions
    const events = await Event.find({
      _id: { $in: eventIds },
    }).lean()

    // Create a map of events by ID for quick lookup
    const eventMap = {}
    events.forEach((event) => {
      eventMap[event._id.toString()] = event
    })

    // Transform form submissions into tickets
    const tickets = formSubmissions.map((submission) => {
      const event = eventMap[submission.eventId.toString()]

      return {
        _id: submission._id.toString(),
        eventId: submission.eventId.toString(),
        title: event?.title || "Event",
        date: event?.date || null,
        startTime: event?.startTime || null,
        endTime: event?.endTime || null,
        location: event?.location || null,
        venue: event?.venue || null,
        image: event?.image || null,
        ticketType: submission.formType || "attendee",
        status: submission.status,
        formData: submission.formData || {},
        createdAt: submission.createdAt,
        event: {
          _id: event?._id.toString() || null,
          title: event?.title || "Event",
          date: event?.date || null,
          startTime: event?.startTime || null,
          endTime: event?.endTime || null,
          location: event?.location || null,
          venue: event?.venue || null,
          image: event?.image || null,
        },
      }
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: "Failed to fetch tickets", details: error.message }, { status: 500 })
  }
}
