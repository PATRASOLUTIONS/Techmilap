import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase()

    // Import models after database connection is established
    const Event = (await import("@/models/Event")).default

    // Get query parameters
    const url = new URL(req.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const skip = (page - 1) * limit
    const sort = url.searchParams.get("sort") || "date"
    const order = url.searchParams.get("order") || "desc"
    const search = url.searchParams.get("search") || ""
    const category = url.searchParams.get("category") || ""
    const status = url.searchParams.get("status") || "published"
    const past = url.searchParams.get("past") === "true"

    // Build query
    const query: any = {}

    // Add status filter if provided
    if (status) {
      query.status = status
    }

    // Add category filter if provided
    if (category) {
      query.category = category
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ]
    }

    // Add date filter for past/upcoming events
    const now = new Date()
    if (past) {
      query.date = { $lt: now }
    } else {
      query.date = { $gte: now }
    }

    // Get events
    const events = await Event.find(query)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .select("_id title date location image capacity attendees status slug")
      .lean()

    // Get total count
    const total = await Event.countDocuments(query)

    return NextResponse.json({
      events,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
