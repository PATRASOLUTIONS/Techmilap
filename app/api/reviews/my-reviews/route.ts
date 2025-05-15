import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const eventId = url.searchParams.get("eventId")
    const status = url.searchParams.get("status")
    const rating = url.searchParams.get("rating")
    const search = url.searchParams.get("search")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const { db } = await connectToDatabase()

    // Build the query
    const query: any = {
      userId: new mongoose.Types.ObjectId(session.user.id),
    }

    // Apply filters
    if (eventId && eventId !== "all") {
      query.eventId = new mongoose.Types.ObjectId(eventId)
    }

    if (status && status !== "all") {
      query.status = status
    }

    if (rating && rating !== "all") {
      query.rating = Number.parseInt(rating)
    }

    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { comment: { $regex: search, $options: "i" } }]
    }

    // Get total count for pagination
    const totalCount = await db.collection("reviews").countDocuments(query)

    // Get reviews with pagination
    let reviews = await db
      .collection("reviews")
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "eventDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $addFields: {
            event: { $arrayElemAt: ["$eventDetails", 0] },
            user: { $arrayElemAt: ["$userDetails", 0] },
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            comment: 1,
            rating: 1,
            status: 1,
            reply: 1,
            createdAt: 1,
            updatedAt: 1,
            "event._id": 1,
            "event.title": 1,
            "event.date": 1,
            "event.location": 1,
            "event.image": 1,
            "user._id": 1,
            "user.firstName": 1,
            "user.lastName": 1,
            "user.email": 1,
            "user.profileImage": 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ])
      .toArray()

    if (!reviews) {
      reviews = []
    }

    const populatedReviews = await Promise.all(
      reviews.map(async (review) => {
        try {
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
                  name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User",
                  email: user.email,
                  image: user.profileImage,
                }
              : { name: "Unknown User" },
          }
        } catch (err) {
          console.error("Error populating review:", err)
          return {
            ...review,
            event: { title: "Unknown Event" },
            user: { name: "Unknown User" },
          }
        }
      }),
    )

    // Get statistics
    const stats = {
      total: totalCount,
      average: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    }

    // Get counts by status
    const statusCounts = await db
      .collection("reviews")
      .aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(session.user.id) } },
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

    // Get counts by rating
    const ratingCounts = await db
      .collection("reviews")
      .aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(session.user.id) } },
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    ratingCounts.forEach((item) => {
      if (item._id >= 1 && item._id <= 5) {
        stats.ratings[item._id] = item.count
      }
    })

    // Calculate average rating
    const ratingResult = await db
      .collection("reviews")
      .aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(session.user.id) } },
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
      reviews: populatedReviews || [],
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
      events: [],
      stats: stats,
    })
  } catch (error) {
    console.error("Error fetching my reviews:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch reviews",
        reviews: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          pages: 0,
        },
        events: [],
        stats: {
          total: 0,
          average: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          ratings: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
        },
      },
      { status: 500 },
    )
  }
}
