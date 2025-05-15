import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { extractNameFromFormData, extractEmailFromFormData } from "@/lib/ticket-utils"

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    console.log(`Fetching tickets for user: ${userId}`)

    // Get query parameters
    const url = new URL(req.url)
    const excludeOrganizer = url.searchParams.get("exclude") === "organizer"
    const eventId = url.searchParams.get("eventId")

    // Connect to database
    const { db } = await connectToDatabase()

    // Build query for tickets
    const ticketQuery: any = { userId: new ObjectId(userId) }
    if (eventId) {
      ticketQuery.event = new ObjectId(eventId)
    }

    // Fetch tickets
    console.log("Fetching tickets with query:", JSON.stringify(ticketQuery))
    const tickets = await db.collection("tickets").find(ticketQuery).toArray()
    console.log(`Found ${tickets.length} tickets`)

    // Build query for form submissions (registrations, volunteer applications, speaker applications)
    const submissionQuery: any = {
      userId: userId,
      status: "approved", // Only include approved submissions
    }

    if (eventId) {
      submissionQuery.eventId = new ObjectId(eventId)
    }

    // Fetch form submissions
    console.log("Fetching form submissions with query:", JSON.stringify(submissionQuery))
    const formSubmissions = await db.collection("formsubmissions").find(submissionQuery).toArray()
    console.log(`Found ${formSubmissions.length} form submissions`)

    // Get event IDs from tickets and submissions
    const eventIds = [
      ...new Set([
        ...tickets.map((ticket) => ticket.event.toString()),
        ...formSubmissions.map((submission) => submission.eventId.toString()),
      ]),
    ].map((id) => new ObjectId(id))

    // Fetch events
    const events =
      eventIds.length > 0
        ? await db
            .collection("events")
            .find({ _id: { $in: eventIds } })
            .toArray()
        : []
    console.log(`Found ${events.length} events`)

    // Create a map of events for easy lookup
    const eventMap = events.reduce((map, event) => {
      map[event._id.toString()] = event
      return map
    }, {})

    // Process tickets
    const processedTickets = tickets.map((ticket) => {
      const eventId = ticket.event.toString()
      const event = eventMap[eventId] || {}

      return {
        ...ticket,
        event,
        isFormSubmission: false,
      }
    })

    // Process form submissions as tickets
    const submissionTickets = formSubmissions.map((submission) => {
      const eventId = submission.eventId.toString()
      const event = eventMap[eventId] || {}
      const formData = submission.data || {}

      return {
        _id: submission._id,
        userId: submission.userId,
        event,
        eventId: submission.eventId,
        ticketType: submission.formType || "attendee",
        formType: submission.formType || "attendee",
        status: submission.status,
        purchasedAt: submission.createdAt,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        isCheckedIn: submission.isCheckedIn || false,
        checkedInAt: submission.checkedInAt,
        formData,
        isFormSubmission: true,
        name: extractNameFromFormData(formData, submission),
        email: extractEmailFromFormData(formData, submission),
      }
    })

    // Combine tickets and submissions
    const allTickets = [...processedTickets, ...submissionTickets]

    // Sort by date (newest first)
    allTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Filter out tickets for events where the user is the organizer (if requested)
    const filteredTickets = excludeOrganizer
      ? allTickets.filter((ticket) => ticket.event?.organizerId?.toString() !== userId)
      : allTickets

    // Separate tickets into upcoming and past
    const now = new Date()
    const upcoming = []
    const past = []

    filteredTickets.forEach((ticket) => {
      const eventDate = ticket.event?.date ? new Date(ticket.event.date) : null
      if (eventDate && eventDate > now) {
        upcoming.push(ticket)
      } else {
        past.push(ticket)
      }
    })

    return NextResponse.json({
      success: true,
      tickets: {
        all: filteredTickets,
        upcoming,
        past,
      },
    })
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}
