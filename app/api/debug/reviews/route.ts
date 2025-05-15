import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only event planners and super admins can access this endpoint
    if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { db } = await connectToDatabase()
    const url = new URL(req.url)
    const eventId = url.searchParams.get("eventId")
    const userId = url.searchParams.get("userId") || session.user.id

    // Get all events for this organizer
    const events = await db
      .collection("events")
      .find({
        organizerId: new ObjectId(userId),
      })
      .project({ _id: 1, title: 1, organizerId: 1 })
      .toArray()

    const eventIds = events.map((event) => event._id)

    // Get all reviews in the system (limited to 10)
    const allReviews = await db.collection("reviews").find({}).limit(10).toArray()

    // Get reviews for this organizer's events
    const query = eventId ? { eventId: new ObjectId(eventId) } : { eventId: { $in: eventIds } }
    const organizerReviews = await db.collection("reviews").find(query).toArray()

    // Get a specific event if eventId is provided
    let specificEvent = null
    if (eventId) {
      specificEvent = await db.collection("events").findOne({ _id: new ObjectId(eventId) })
    }

    return NextResponse.json({
      userId: userId,
      userRole: session.user.role,
      events: events.map((e) => ({
        _id: e._id.toString(),
        title: e.title,
        organizerId: e.organizerId.toString(),
      })),
      eventCount: events.length,
      allReviewsCount: allReviews.length,
      allReviewsSample: allReviews.map((r) => ({
        _id: r._id.toString(),
        eventId: r.eventId?.toString(),
        title: r.title,
        status: r.status,
      })),
      organizerReviewsCount: organizerReviews.length,
      organizerReviews: organizerReviews.map((r) => ({
        _id: r._id.toString(),
        eventId: r.eventId?.toString(),
        title: r.title,
        status: r.status,
      })),
      specificEvent: specificEvent
        ? {
            _id: specificEvent._id.toString(),
            title: specificEvent.title,
            organizerId: specificEvent.organizerId.toString(),
          }
        : null,
    })
  } catch (error) {
    console.error("Error in debug reviews endpoint:", error)
    return NextResponse.json({ error: "Failed to fetch debug information" }, { status: 500 })
  }
}
