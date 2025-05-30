import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import Review from "@/models/Review"
import Event from "@/models/Event"

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

    console.log("Planner API called by user:", session.user.id, "role:", session.user.role)

    await connectToDatabase()

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const eventId = searchParams.get("eventId")
    const rating = searchParams.get("rating")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const tab = searchParams.get("tab")
    const sort = searchParams.get("sort") || "date" // "date" (default), "rating-high", "rating-low"

    const skip = (page - 1) * limit

    console.log("Planner API query params:", { page, limit, eventId, rating, status, search, tab, sort })

    // Build the query
    const query: any = {}

    // If not super admin, only show reviews for events created by this user
    if (session.user.role !== "super-admin") {
      try {
        // First, get all events created by this user
        const events = await Event.find({
          $or: [
            { organizer: new ObjectId(session.user.id) },
            { "organizer.id": new ObjectId(session.user.id) },
            { "organizer._id": new ObjectId(session.user.id) },
            { userId: new ObjectId(session.user.id) },
          ],
        }).lean() // Use .lean() for plain JavaScript objects
          .select({ _id: 1 })
        // .toArray()

        console.log("Found events for organizer:", events.length)

        if (events.length === 0) {
          // No events found, return empty response
          return NextResponse.json({
            reviews: [],
            totalPages: 0,
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
          })
        }

        const eventIds = events.map((event: any) => event._id)
        query.eventId = { $in: eventIds }
      } catch (error) {
        console.error("Error finding organizer events:", error)
        // Continue without filtering by event if there's an error
      }
    }

    // Apply filters
    if (eventId && eventId !== "all") {
      try {
        query.eventId = new ObjectId(eventId)
      } catch (err) {
        console.error("Invalid eventId format:", eventId)
      }
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
      query.$or = [{ title: { $regex: search, $options: "i" } }, { comment: { $regex: search, $options: "i" } }]
    }

    console.log("Final MongoDB query:", JSON.stringify(query))

    // Get total count for pagination
    const totalCount = await Review.countDocuments(query)
    console.log("Total reviews count:", totalCount)

    // Determine sort options
    let sortOptions = {}

    switch (sort) {
      case "rating-high":
        sortOptions = { rating: -1, createdAt: -1 }
        break
      case "rating-low":
        sortOptions = { rating: 1, createdAt: -1 }
        break
      case "date":
      default:
        sortOptions = { createdAt: -1 }
    }

    // Get reviews with pagination
    const aggregationPipeline = [
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
          user: { $arrayElemAt: ["$userDetails", 0] },
          event: { $arrayElemAt: ["$eventDetails", 0] },
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
          userId: 1,
          eventId: 1,
          userDetails: 1, // Keep for backward compatibility
          eventDetails: 1, // Keep for backward compatibility
          "user._id": 1,
          "user.firstName": 1,
          "user.lastName": 1,
          "user.name": 1,
          "user.email": 1,
          "user.image": 1,
          "user.profileImage": 1,
          "event._id": 1,
          "event.title": 1,
          "event.name": 1,
          "event.date": 1,
          "event.location": 1,
          "event.image": 1,
        },
      },
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: limit },
    ]

    const reviews = await Review.aggregate(aggregationPipeline)
    console.log("Retrieved reviews:", reviews.length)

    if (reviews.length > 0) {
      console.log("Sample review:", JSON.stringify(reviews[0], null, 2).substring(0, 200) + "...")
    }

    // Get statistics
    const stats: any = {
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
    const statusCounts = await Review.collection.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    statusCounts.forEach((item) => {
      if (item._id === "pending") stats.pending = item.count
      if (item._id === "approved") stats.approved = item.count
      if (item._id === "rejected") stats.rejected = item.count
    })

    // Get counts by rating
    const ratingCounts = await Review.collection.aggregate([
      { $match: query },
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
    const ratingResult = await Review.collection
      .aggregate([
        { $match: { ...query, status: "approved" } },
        { $project: { rating: 1 } }, // Add projection to only include rating field
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
