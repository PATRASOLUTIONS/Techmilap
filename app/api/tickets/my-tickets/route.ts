import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"

export async function GET(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("My Tickets API - User:", session.user.id)

    // Connect to database first
    await connectToDatabase()

    // Import models after database connection is established
    // This ensures models are registered properly
    const Ticket = (await import("@/models/Ticket")).default
    const FormSubmission = (await import("@/models/FormSubmission")).default
    const Event = (await import("@/models/Event")).default

    // Parse query parameters
    const url = new URL(req.url)
    const exclude = url.searchParams.get("exclude") || undefined
    const userId = session.user.id

    console.log("My Tickets API - Fetching tickets for user:", userId)

    // 1. Get tickets directly
    let tickets = []
    try {
      tickets = await Ticket.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ purchasedAt: -1 })
        .populate({
          path: "event",
          model: Event,
          select: "title date location status image capacity attendees _id slug organizer startTime endTime",
        })
        .lean()

      console.log(`Found ${tickets.length} regular tickets`)
    } catch (error) {
      console.error("Error fetching tickets:", error)
      tickets = []
    }

    // 2. Get approved form submissions
    let approvedSubmissions = []
    try {
      approvedSubmissions = await FormSubmission.find({
        userId: new mongoose.Types.ObjectId(userId),
        status: "approved",
      })
        .populate({
          path: "eventId",
          model: Event,
          select: "title date location status image capacity attendees _id slug organizer startTime endTime",
        })
        .lean()

      console.log(`Found ${approvedSubmissions.length} approved form submissions`)
    } catch (error) {
      console.error("Error fetching form submissions:", error)
      approvedSubmissions = []
    }

    // Add more detailed logging to help debug
    console.log(
      "Approved submissions details:",
      approvedSubmissions.map((sub) => ({
        id: sub._id,
        eventId: sub.eventId?._id || sub.eventId,
        formType: sub.formType,
        status: sub.status,
      })),
    )

    // Convert form submissions to ticket format
    const submissionTickets = approvedSubmissions
      .filter((submission) => submission.eventId) // Filter out submissions with no event
      .map((submission) => {
        // Get the event data
        const event = submission.eventId

        // Create a ticket from the submission
        return {
          _id: submission._id,
          userId: submission.userId,
          event: event, // This is the populated event data
          ticketType: submission.formType || "attendee", // 'attendee', 'volunteer', or 'speaker'
          ticketNumber: submission._id.toString().substring(0, 8).toUpperCase(),
          price: 0,
          status: "confirmed",
          purchasedAt: submission.createdAt,
          isFormSubmission: true, // Flag to identify this as a form submission
          formData: submission.data || {}, // Include the form data with fallback
          formType: submission.formType,
          // Add these fields to match regular tickets
          attendeeName:
            submission.userName || (submission.data ? submission.data.name || submission.data.fullName : "Attendee"),
          attendeeEmail: submission.userEmail || (submission.data ? submission.data.email : ""),
        }
      })

    // Add more detailed logging
    console.log(
      "Converted submission tickets:",
      submissionTickets.map((ticket) => ({
        id: ticket._id,
        eventId: ticket.event?._id || ticket.event,
        ticketType: ticket.ticketType,
        formType: ticket.formType,
      })),
    )

    // Combine regular tickets and submission tickets
    const allTickets = [...tickets, ...submissionTickets].filter((ticket) => ticket.event) // Filter out tickets with no event

    // Add additional fields for display
    const processedTickets = allTickets.map((ticket) => {
      // For regular tickets
      if (!ticket.isFormSubmission) {
        return {
          ...ticket,
          // Add any missing fields
          ticketNumber: ticket.ticketNumber || ticket._id.toString().substring(0, 8).toUpperCase(),
        }
      }
      // For form submissions
      return ticket
    })

    // Filter tickets based on exclude parameter
    let filteredTickets = [...processedTickets]

    if (exclude === "organizer") {
      // Only exclude organizer tickets if the user has the role of "organizer" or "admin"
      if (session.user.role === "organizer" || session.user.role === "admin") {
        // Remove tickets for events where user is organizer
        filteredTickets = processedTickets.filter((ticket) => {
          if (!ticket.event) return false // Skip tickets with no event
          // Check if this event's organizer is the current user
          return ticket.event.organizer?.toString() !== userId
        })
      }
      // For regular users, don't exclude any tickets
    }

    // Separate tickets into upcoming and past
    const now = new Date()
    const upcoming = filteredTickets.filter((ticket) => ticket.event && new Date(ticket.event.date) >= now)
    const past = filteredTickets.filter((ticket) => ticket.event && new Date(ticket.event.date) < now)

    console.log(`User role: ${session.user.role}, applying exclude=${exclude} filter`)
    console.log(
      `Found ${allTickets.length} tickets (${tickets.length} regular, ${submissionTickets.length} from submissions), filtered to ${filteredTickets.length}`,
    )

    // Return the filtered tickets
    return NextResponse.json({
      tickets: {
        all: filteredTickets,
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
    console.error("Error fetching tickets:", error.stack || error.message || error)
    return NextResponse.json({ error: `Failed to fetch tickets: ${error.message}` }, { status: 500 })
  }
}
