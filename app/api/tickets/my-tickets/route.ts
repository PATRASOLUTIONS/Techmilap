import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import Ticket from "@/models/Ticket"
import FormSubmission from "@/models/FormSubmission"
import mongoose from "mongoose"

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

    // 1. Get tickets directly
    const tickets = await Ticket.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ purchasedAt: -1 })
      .populate({
        path: "event",
        select: "title date location status image capacity attendees _id slug organizer startTime endTime",
      })
      .lean()

    // 2. Get approved form submissions
    const approvedSubmissions = await FormSubmission.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: "approved",
    })
      .populate({
        path: "eventId", // This should match the field name in the FormSubmission model
        select: "title date location status image capacity attendees _id slug organizer startTime endTime",
      })
      .lean()

    console.log(`Found ${approvedSubmissions.length} approved form submissions`)

    // Convert form submissions to ticket format
    const submissionTickets = approvedSubmissions.map((submission) => ({
      _id: submission._id,
      userId: submission.userId,
      event: submission.eventId, // This is the populated event data
      ticketType: submission.formType, // 'attendee', 'volunteer', or 'speaker'
      purchasedAt: submission.createdAt,
      status: "confirmed",
      isFormSubmission: true, // Flag to identify this as a form submission
      formData: submission.data, // Include the form data
    }))

    // Combine regular tickets and submission tickets
    const allTickets = [...tickets, ...submissionTickets]

    // Filter tickets based on exclude parameter
    let filteredTickets = [...allTickets]

    if (exclude === "organizer") {
      // Remove tickets for events where user is organizer
      filteredTickets = allTickets.filter((ticket) => {
        if (!ticket.event) return false // Skip tickets with no event
        // Check if this event's organizer is the current user
        return ticket.event.organizer?.toString() !== userId
      })
    }

    // Separate tickets into upcoming and past
    const now = new Date()
    const upcoming = filteredTickets.filter((ticket) => ticket.event && new Date(ticket.event.date) >= now)

    const past = filteredTickets.filter((ticket) => ticket.event && new Date(ticket.event.date) < now)

    console.log(
      `Found ${allTickets.length} tickets (${tickets.length} regular, ${submissionTickets.length} from submissions), filtered to ${filteredTickets.length}`,
    )

    // Return the filtered tickets
    return NextResponse.json({
      tickets: {
        all: filteredTickets.map((ticket) => ({
          ...ticket,
          event: ticket.event || { title: "Event no longer available" },
        })),
        upcoming,
        past,
      },
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
