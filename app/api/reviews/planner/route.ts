import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
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

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const eventId = searchParams.get("eventId")
    const rating = searchParams.get("rating")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const tab = searchParams.get("tab")

    const skip = (page - 1) * limit

    // Build the query
    const query: any = {}

    // If not super admin, only show reviews for events created by this user
    if (session.user.role !== "super-admin") {
      // First, get all events created by this user
      const events = await db
        .collection("events")
        .find({
          organizerId: new ObjectId(session.user.id),
        })
        .project({ _id: 1 })
        .toArray()

      const eventIds = events.map((event) => event._id)
      query.eventId = { $in: eventIds }
    }

    // Apply filters
    if (eventId && eventId !== "all") {
      query.eventId = new ObjectId(eventId)
    }

    if (rating && rating !== "all") {
      query.rating = Number.parseInt(rating)
    }

    if (status && status !== "all") {
      query.status = status
    }

    if (tab && tab !== "all") {
      query.status = tab
    }

    if (search) {
      query.$or = [
        { text: { $regex: search, $options: "i" } },
        { "userId.name": { $regex: search, $options: "i" } },
        { "event.name": { $regex: search, $options: "i" } },
      ]
    }

    // Get total count for pagination
    const totalCount = await db.collection("reviews").countDocuments(query)

    // Get reviews with pagination
    const reviews = await db
      .collection("reviews")
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "eventDetails",
          },
        },
        {
          $addFields: {
            userId: { $arrayElemAt: ["$userDetails", 0] },
            event: { $arrayElemAt: ["$eventDetails", 0] },
          },
        },
        {
          $project: {
            _id: 1,
            text: 1,
            rating: 1,
            status: 1,
            reply: 1,
            replyDate: 1,
            createdAt: 1,
            updatedAt: 1,
            "userId._id": 1,
            "userId.name": 1,
            "userId.email": 1,
            "userId.image": 1,
            "event._id": 1,
            "event.name": 1,
            "event.date": 1,
            "event.location": 1,
            "event.imageUrl": 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ])
      .toArray()

    // Get statistics
    const stats = {
      total: totalCount,
      average: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    }

    // Get counts by status
    const statusCounts = await db
      .collection("reviews")
      .aggregate([
        { $match: query },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    statusCounts.forEach((item) => {
      if (item._id === "pending") stats.pending = item.count
      if (item._id === "approved") stats.approved = item.count
      if (item._id === "rejected") stats.rejected = item.count
    })

    // Calculate average rating
    const ratingResult = await db
      .collection("reviews")
      .aggregate([
        { $match: { ...query, status: "approved" } },
        {
          $group: {
            _id: null,
            average: { $avg: "$rating" },
          },
        },
      ])
      .toArray()

    if (ratingResult.length > 0) {
      stats.average = Number.parseFloat(ratingResult[0].average.toFixed(1))
    }

    return NextResponse.json({
      reviews,
      totalPages: Math.ceil(totalCount / limit),
      stats,
    })
  } catch (error) {
    console.error("Error fetching planner reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}
