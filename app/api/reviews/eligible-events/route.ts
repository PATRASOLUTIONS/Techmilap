import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const userId = new ObjectId(session.user.id)

    // Find events the user is registered for
    // This includes:
    // 1. Events with the user in the registrations array
    // 2. Events with approved form submissions from the user

    // First, get events where the user is directly registered
    const registeredEvents = await db
      .collection("events")
      .find({
        "registrations.userId": userId,
      })
      .toArray()

    // Next, get events where the user has approved form submissions
    const approvedSubmissions = await db
      .collection("formsubmissions")
      .find({
        userId: userId,
        status: "approved",
        formType: { $in: ["attendee", "speaker", "volunteer"] },
      })
      .toArray()

    // Get the event IDs from the submissions
    const submissionEventIds = approvedSubmissions.map((sub) => sub.eventId)

    // Fetch those events
    const submissionEvents =
      submissionEventIds.length > 0
        ? await db
            .collection("events")
            .find({
              _id: { $in: submissionEventIds },
            })
            .toArray()
        : []

    // Combine the events and remove duplicates
    const allEvents = [...registeredEvents]

    // Add events from submissions if they're not already in the list
    for (const event of submissionEvents) {
      if (!allEvents.some((e) => e._id.toString() === event._id.toString())) {
        allEvents.push(event)
      }
    }

    // Check if the user has already reviewed each event
    const userReviews = await db
      .collection("reviews")
      .find({
        userId: userId,
      })
      .toArray()

    const reviewedEventIds = userReviews.map((review) => review.eventId.toString())

    // Filter out events that have already been reviewed
    const eligibleEvents = allEvents.filter((event) => !reviewedEventIds.includes(event._id.toString()))

    // Format the response
    const formattedEvents = eligibleEvents.map((event) => ({
      _id: event._id,
      title: event.title,
      date: event.date,
      image: event.image,
    }))

    return NextResponse.json({
      events: formattedEvents,
    })
  } catch (error) {
    console.error("Error fetching eligible events:", error)
    return NextResponse.json({ error: "Failed to fetch eligible events" }, { status: 500 })
  }
}
