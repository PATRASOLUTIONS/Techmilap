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

    // Get query parameters
    const url = new URL(req.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const status = url.searchParams.get("status")
    const eventId = url.searchParams.get("eventId")
    const search = url.searchParams.get("search")
    const skip = (page - 1) * limit

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
      .project({ _id: 1 })
      .toArray()

    // Next, get events where the user has approved form submissions
    const approvedSubmissions = await db
      .collection("formsubmissions")
      .find({
        userId: userId,
        status: "approved",
        formType: { $in: ["attendee", "speaker", "volunteer"] },
      })
      .project({ eventId: 1 })
      .toArray()

    // Combine the event IDs
    const registeredEventIds = registeredEvents.map((event) => event._id)
    const submissionEventIds = approvedSubmissions.map((sub) => sub.eventId)

    // Merge and remove duplicates
    const allEventIds = [...new Set([...registeredEventIds, ...submissionEventIds])]

    // If the user isn't registered for any events, return empty array
    if (allEventIds.length === 0) {
      return NextResponse.json({
        reviews: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0,
        },
        events: [],
      })
    }

    // Build the query for reviews
    const query: any = {
      $or: [
        // Reviews created by the user
        { userId },
        // Reviews for events the user is registered for
        { eventId: { $in: allEventIds } },
      ],
    }

    // Add filters if provided
    if (status) {
      query.status = status
    }

    if (eventId) {
      query.eventId = new ObjectId(eventId)
    }

    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { comment: { $regex: search, $options: "i" } }]
    }

    // Get reviews with pagination
    const reviews = await db.collection("reviews").find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()

    // Get total count for pagination
    const total = await db.collection("reviews").countDocuments(query)

    // Get event details for the dropdown filter
    const events = await db
      .collection("events")
      .find({ _id: { $in: allEventIds } })
      .project({ _id: 1, title: 1, date: 1, image: 1 })
      .toArray()

    // Populate event and user details for each review
    const populatedReviews = await Promise.all(
      reviews.map(async (review) => {
        // Get event details
        const event = await db
          .collection("events")
          .findOne({ _id: review.eventId }, { projection: { title: 1, date: 1, image: 1 } })

        // Get user details
        const user = await db
          .collection("users")
          .findOne({ _id: review.userId }, { projection: { firstName: 1, lastName: 1, email: 1, profileImage: 1 } })

        return {
          ...review,
          event: event || { title: "Unknown Event" },
          user: user
            ? {
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                image: user.profileImage,
              }
            : { name: "Unknown User" },
        }
      }),
    )

    return NextResponse.json({
      reviews: populatedReviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      events,
    })
  } catch (error) {
    console.error("Error fetching my reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}
