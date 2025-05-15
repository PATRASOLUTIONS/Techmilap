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
      // Convert userId to ObjectId if it's a string
      const userIdObj = typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId

      console.log(`Fetching tickets for user ID: ${userId} (${typeof userId})`)

      tickets = await Ticket.find({
        userId: userIdObj,
      })
        .sort({ purchasedAt: -1 })
        .populate({
          path: "event",
          model: Event,
          select: "title date location status image capacity attendees _id slug organizer startTime endTime",
        })
        .lean()

      console.log(`Found ${tickets.length} regular tickets`)

      // Debug the first few tickets if any
      if (tickets.length > 0) {
        console.log("Sample ticket data:", JSON.stringify(tickets[0], null, 2).substring(0, 500) + "...")
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
      tickets = []
    }

    // 2. Get approved form submissions
    let approvedSubmissions = []
    try {
      // Convert userId to ObjectId if it's a string
      const userIdObj = typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId

      approvedSubmissions = await FormSubmission.find({
        userId: userIdObj,
        status: "approved",
      })
        .populate({
          path: "eventId",
          model: Event,
          select: "title date location status image capacity attendees _id slug organizer startTime endTime",
        })
        .lean()

      console.log(`Found ${approvedSubmissions.length} approved form submissions`)

      // Debug the first submission if any
      if (approvedSubmissions.length > 0) {
        console.log(
          "Sample submission data:",
          JSON.stringify(approvedSubmissions[0], null, 2).substring(0, 500) + "...",
        )
      }
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
      .filter((submission) => {
        // Filter out submissions with no event and log the reason
        if (!submission.eventId) {
          console.log(`Skipping submission ${submission._id} - missing eventId`)
          return false
        }
        return true
      })
      .map((submission) => {
        // Get the event data
        const event = submission.eventId

        // Create a ticket from the submission
        const ticket = {
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

        console.log(`Created ticket from submission ${submission._id} for event ${event.title || "Unknown"}`)
        return ticket
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

    // Only apply organizer filtering for organizers and admins, and only when explicitly requested
    if (exclude === "organizer" && (session.user.role === "organizer" || session.user.role === "admin")) {
      // Remove tickets for events where user is organizer
      const originalCount = filteredTickets.length
      filteredTickets = processedTickets.filter((ticket) => {
        if (!ticket.event) return false // Skip tickets with no event
        // Check if this event's organizer is the current user
        const isOrganizer = ticket.event.organizer?.toString() === userId.toString()
        return !isOrganizer
      })
      console.log(`Filtered out ${originalCount - filteredTickets.length} organizer tickets`)
    }

    // Final check to ensure we have tickets
    if (filteredTickets.length === 0 && (tickets.length > 0 || approvedSubmissions.length > 0)) {
      console.log("WARNING: Found source tickets/submissions but filtered list is empty. Returning unfiltered tickets.")
      filteredTickets = [...processedTickets]
    }

    // Separate tickets into upcoming and past
    const now = new Date()
    const upcoming = filteredTickets.filter((ticket) => ticket.event && new Date(ticket.event.date) >= now)
    const past = filteredTickets.filter((ticket) => ticket.event && new Date(ticket.event.date) < now)

    console.log(`User role: ${session.user.role}, final ticket count: ${filteredTickets.length}`)
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
