import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import Ticket from "@/models/Ticket"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    await connectToDatabase()

    // Parse query parameters
    const url = new URL(req.url)
    const exclude = url.searchParams.get("exclude") || undefined
    const userId = session.user.id

    // First approach - Get tickets directly
    const tickets = await Ticket.find({ userId: new ObjectId(userId) })
      .sort({ purchasedAt: -1 })
      .populate({
        path: "event",
        select: "title date location status image capacity attendees _id slug organizer",
      })
      .lean()

    // Filter tickets based on exclude parameter
    let filteredTickets = [...tickets]

    if (exclude === "organizer") {
      // Remove tickets for events where user is organizer
      filteredTickets = tickets.filter((ticket) => {
        if (!ticket.event) return false // Skip tickets with no event
        // Check if this event's organizer is the current user
        return ticket.event.organizer?.toString() !== userId
      })
    }

    console.log(`Found ${tickets.length} tickets, filtered to ${filteredTickets.length}`)

    // Return the filtered tickets
    return NextResponse.json({
      tickets: filteredTickets.map((ticket) => ({
        ...ticket,
        event: ticket.event || { title: "Event no longer available" },
      })),
      pagination: {
        total: filteredTickets.length,
        page: 1,
        limit: filteredTickets.length,
        pages: 1,
      },
    })
  } catch (error: any) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: `Failed to fetch tickets: ${error.message}` }, { status: 500 })
  }
}
