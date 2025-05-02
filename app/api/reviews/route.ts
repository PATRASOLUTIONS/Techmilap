import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import Review from "@/models/Review"
import Event from "@/models/Event"
import mongoose from "mongoose"

// Create a new review
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId, rating, title, comment } = await req.json()

    if (!eventId || !rating || !title || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectToDatabase()

    // Check if the event exists
    const event = await Event.findById(eventId)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user has already reviewed this event
    const existingReview = await Review.findOne({
      eventId: new mongoose.Types.ObjectId(eventId),
      userId: new mongoose.Types.ObjectId(session.user.id),
    })

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this event" }, { status: 400 })
    }

    // Create the review
    const review = await Review.create({
      eventId: new mongoose.Types.ObjectId(eventId),
      userId: new mongoose.Types.ObjectId(session.user.id),
      rating,
      title,
      comment,
      status: "pending", // Reviews are pending by default
    })

    return NextResponse.json({ success: true, review }, { status: 201 })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}

// Get all reviews (with filtering options)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const eventId = url.searchParams.get("eventId")
    const status = url.searchParams.get("status")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    await connectToDatabase()

    const query: any = {}

    // If eventId is provided, filter by eventId
    if (eventId) {
      query.eventId = new mongoose.Types.ObjectId(eventId)
    }

    // If status is provided, filter by status
    if (status) {
      query.status = status
    }

    // For regular users, only show their own reviews
    if (session.user.role === "user") {
      query.userId = new mongoose.Types.ObjectId(session.user.id)
    }
    // For event planners, only show reviews for their events
    else if (session.user.role === "event-planner") {
      const userEvents = await Event.find({ organizer: session.user.id }).select("_id")
      const eventIds = userEvents.map((event) => event._id)
      query.eventId = { $in: eventIds }
    }
    // Super admins can see all reviews

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("eventId", "title date location image")
      .populate("userId", "firstName lastName email profileImage")

    const total = await Review.countDocuments(query)

    return NextResponse.json({
      success: true,
      reviews,
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
