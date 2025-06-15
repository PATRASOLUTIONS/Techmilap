import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user has admin privileges (either admin or super-admin role)
    const userRole = session.user.role
    if (userRole !== "admin" && userRole !== "super-admin") {
      console.log(`Access denied: User role is ${userRole}, required admin or super-admin`)
      return NextResponse.json(
        {
          error: "Not authorized. Admin role required.",
          userRole: userRole,
        },
        { status: 403 },
      )
    }

    // Connect to database
    const db = await connectToDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Import models
    const Event = (await import("@/models/Event")).default
    const FormSubmission = (await import("@/models/FormSubmission")).default

    // Get query parameters
    const url = new URL(req.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const skip = (page - 1) * limit
    const sort = url.searchParams.get("sort") || "createdAt"
    const order = url.searchParams.get("order") || "desc"
    const search = url.searchParams.get("search") || ""

    // Build query
    const query: any = {}

    // Add search filter if provided
    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Get total count first
    const total = await Event.countDocuments(query)

    // Get events with organizer information
    const events = await Event.find(query)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .populate("organizer", "name firstName lastName email")
      .lean()

    // Get counts for each event
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        try {
          const [attendeeCount, volunteerCount, speakerCount] = await Promise.all([
            FormSubmission.countDocuments({
              eventId: event._id,
              formType: "attendee",
              status: "approved",
            }),
            FormSubmission.countDocuments({
              eventId: event._id,
              formType: "volunteer",
              status: "approved",
            }),
            FormSubmission.countDocuments({
              eventId: event._id,
              formType: "speaker",
              status: "approved",
            }),
          ])

          return {
            ...event,
            attendeeCount,
            volunteerCount,
            speakerCount,
          }
        } catch (error) {
          console.error(`Error getting counts for event ${event._id}:`, error)
          return {
            ...event,
            attendeeCount: 0,
            volunteerCount: 0,
            speakerCount: 0,
            error: "Failed to get counts",
          }
        }
      }),
    )

    return NextResponse.json({
      events: eventsWithCounts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching admin events:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch events",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
