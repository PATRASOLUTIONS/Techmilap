import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const userEmail = session.user.email
    const userName = session.user.name

    console.log("Creating review - User:", userId, "Email:", userEmail)

    const body = await req.json()
    const { eventId, rating, title, comment } = body

    if (!eventId || !rating || !title || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Connect to database
    await connectToDatabase()

    // Import models after database connection is established
    const Review = (await import("@/models/Review")).default
    const Event = (await import("@/models/Event")).default

    // Convert eventId to ObjectId if needed
    let eventObjectId
    try {
      if (mongoose.Types.ObjectId.isValid(eventId)) {
        eventObjectId = new mongoose.Types.ObjectId(eventId)
      } else {
        eventObjectId = eventId
      }
    } catch (error) {
      console.error("Error converting eventId to ObjectId:", error)
      eventObjectId = eventId
    }

    // Convert userId to ObjectId if needed
    let userObjectId
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        userObjectId = new mongoose.Types.ObjectId(userId)
      } else {
        userObjectId = userId
      }
    } catch (error) {
      console.error("Error converting userId to ObjectId:", error)
      userObjectId = userId
    }

    // Check if the event exists
    const event = await Event.findById(eventObjectId)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log("Found event:", event.title)

    // Check if the user has already reviewed this event
    const existingReview = await Review.findOne({
      eventId: eventObjectId,
      userId: userObjectId,
    })

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this event" }, { status: 400 })
    }

    // Create the review
    const review = new Review({
      eventId: eventObjectId,
      userId: userObjectId,
      userEmail: userEmail,
      userName: userName,
      rating,
      title,
      comment,
      status: "pending", // Reviews are pending until approved
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await review.save()
    console.log("Review created:", review._id)

    return NextResponse.json({
      message: "Review submitted successfully",
      review: {
        _id: review._id,
        eventId: review.eventId,
        rating: review.rating,
        title: review.title,
        status: review.status,
      },
    })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url)
    const eventId = url.searchParams.get("eventId")
    const status = url.searchParams.get("status") || "approved"
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // Connect to database
    await connectToDatabase()

    // Import models after database connection is established
    const Review = (await import("@/models/Review")).default
    const Event = (await import("@/models/Event")).default

    // Build query
    const query: any = { status }
    if (eventId) {
      try {
        if (mongoose.Types.ObjectId.isValid(eventId)) {
          query.eventId = new mongoose.Types.ObjectId(eventId)
        } else {
          query.eventId = eventId
        }
      } catch (error) {
        console.error("Error converting eventId to ObjectId:", error)
        query.eventId = eventId
      }
    }

    // Get reviews
    const reviews = await Review.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()

    // Get total count
    const total = await Review.countDocuments(query)

    // Populate event details
    const populatedReviews = await Promise.all(
      reviews.map(async (review) => {
        let event = null
        try {
          event = await Event.findById(review.eventId).select("title image").lean()
        } catch (error) {
          console.error("Error fetching event for review:", error)
        }

        return {
          ...review,
          event,
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
    })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}
