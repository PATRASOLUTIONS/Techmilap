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
    const reviews = await db
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
      reviews,
      totalPages: Math.ceil(totalCount / limit),
      stats,
    })
  } catch (error) {
    console.error("Error fetching user reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}
