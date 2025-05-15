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

    const userId = session.user.id
    console.log("My Tickets API - User:", userId, "Role:", session.user.role)

    // Connect to database first
    await connectToDatabase()

    // Import models after database connection is established
    const Ticket = (await import("@/models/Ticket")).default
    const FormSubmission = (await import("@/models/FormSubmission")).default
    const Event = (await import("@/models/Event")).default
    const User = (await import("@/models/User")).default

    // Verify user exists and get their ObjectId
    let userObjectId
    try {
      // First try to convert the string ID to ObjectId
      if (mongoose.Types.ObjectId.isValid(userId)) {
        userObjectId = new mongoose.Types.ObjectId(userId)
        console.log("User ID converted to ObjectId:", userObjectId)
      } else {
        // If not a valid ObjectId, try to find user by other means
        const user = await User.findOne({
          $or: [{ _id: userId }, { email: session.user.email }],
        })

        if (!user) {
          console.error("User not found in database:", userId, session.user.email)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        userObjectId = user._id
        console.log("Found user by email, using ObjectId:", userObjectId)
      }
    } catch (error) {
      console.error("Error finding user:", error)
      return NextResponse.json({ error: "Error finding user" }, { status: 500 })
    }

    // Parse query parameters
    const url = new URL(req.url)
    const exclude = url.searchParams.get("exclude") || undefined

    console.log("Fetching tickets for user ObjectId:", userObjectId)

    // 1. Get tickets directly
    let tickets = []
    try {
      // Try different query approaches to ensure we find all tickets
      const ticketQueries = [
        { userId: userObjectId },
        { userId: userId.toString() },
        { userId: userObjectId },
        { userId: userId.toString() },
      ]

      // Log the queries we're about to run
      console.log("Running ticket queries:", JSON.stringify(ticketQueries))

      // Run all queries and combine results
      const ticketResults = await Promise.all(
        ticketQueries.map((query) =>
          Ticket.find(query)
            .sort({ purchasedAt: -1 })
            .populate({
              path: "event",
              model: Event,
              select: "title date location status image capacity attendees _id slug organizer startTime endTime",
            })
            .lean(),
        ),
      )

      // Combine and deduplicate results
      const allTickets = ticketResults.flat()
      const ticketIds = new Set()
      tickets = allTickets.filter((ticket) => {
        if (!ticket._id) return false
        const id = ticket._id.toString()
        if (ticketIds.has(id)) return false
        ticketIds.add(id)
        return true
      })

      console.log(`Found ${tickets.length} regular tickets from ${allTickets.length} total results`)

      // Debug the first few tickets if any
      if (tickets.length > 0) {
        console.log("Sample ticket data:", JSON.stringify(tickets[0], null, 2).substring(0, 500) + "...")
      } else {
        // If no tickets found, log the raw database query to help debug
        const rawTickets = await Ticket.find({}).limit(5).lean()
        console.log(
          `No tickets found for user. Sample of ${rawTickets.length} tickets in database:`,
          rawTickets.map((t) => ({
            _id: t._id,
            userId: t.userId,
            status: t.status,
            ticketType: t.ticketType,
          })),
        )
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
      tickets = []
    }

    // 2. Get approved form submissions
    let approvedSubmissions = []
    try {
      // Try different query approaches for form submissions too
      const submissionQueries = [
        { userId: userObjectId, status: "approved" },
        { userId: userId.toString(), status: "approved" },
        { userId: userObjectId, status: "approved" },
        { userId: userId.toString(), status: "approved" },
      ]

      // Log the queries we're about to run
      console.log("Running form submission queries:", JSON.stringify(submissionQueries))

      // Run all queries and combine results
      const submissionResults = await Promise.all(
        submissionQueries.map((query) =>
          FormSubmission.find(query)
            .populate({
              path: "eventId",
              model: Event,
              select: "title date location status image capacity attendees _id slug organizer startTime endTime",
            })
            .lean(),
        ),
      )

      // Combine and deduplicate results
      const allSubmissions = submissionResults.flat()
      const submissionIds = new Set()
      approvedSubmissions = allSubmissions.filter((submission) => {
        if (!submission._id) return false
        const id = submission._id.toString()
        if (submissionIds.has(id)) return false
        submissionIds.add(id)
        return true
      })

      console.log(
        `Found ${approvedSubmissions.length} approved form submissions from ${allSubmissions.length} total results`,
      )

      // Debug the first submission if any
      if (approvedSubmissions.length > 0) {
        console.log(
          "Sample submission data:",
          JSON.stringify(approvedSubmissions[0], null, 2).substring(0, 500) + "...",
        )
      } else {
        // If no submissions found, log the raw database query to help debug
        const rawSubmissions = await FormSubmission.find({}).limit(5).lean()
        console.log(
          `No submissions found for user. Sample of ${rawSubmissions.length} submissions in database:`,
          rawSubmissions.map((s) => ({
            _id: s._id,
            userId: s.userId,
            status: s.status,
            formType: s.formType,
          })),
        )
      }
    } catch (error) {
      console.error("Error fetching form submissions:", error)
      approvedSubmissions = []
    }

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

        console.log(`Created ticket from submission ${submission._id} for event ${event?.title || "Unknown"}`)
        return ticket
      })

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

    // Only apply organizer filtering when explicitly requested
    if (exclude === "organizer") {
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
