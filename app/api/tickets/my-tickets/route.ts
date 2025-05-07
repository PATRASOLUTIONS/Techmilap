import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import FormSubmission from "@/models/FormSubmission"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const userId = session.user.id

    // Get current date for filtering
    const currentDate = new Date()

    // Check if we should exclude organizer tickets
    const url = new URL(req.url)
    const excludeOrganizer = url.searchParams.get("exclude") === "organizer"

    // Find all form submissions for the user (attendee, volunteer, speaker)
    const formSubmissions = await FormSubmission.find({
      $or: [{ userId: userId }, { userEmail: session.user.email }],
      status: "approved", // Only get approved submissions
      ...(excludeOrganizer ? { formType: { $ne: "organizer" } } : {}), // Exclude organizer if requested
    })
      .populate({
        path: "eventId",
        select: "_id title date endDate location venue image slug price startTime endTime",
      })
      .lean()

    // Format submissions as tickets
    const tickets = formSubmissions
      .map((submission) => {
        const event = submission.eventId

        // Skip if event is null (might happen if event was deleted)
        if (!event) return null

        // Generate a unique ticket number based on submission ID and type
        const ticketId = submission._id.toString().slice(-6).toUpperCase()
        const ticketPrefix = submission.formType === "attendee" ? "A" : submission.formType === "volunteer" ? "V" : "S"
        const ticketNumber = `${ticketPrefix}-${ticketId}`

        return {
          _id: submission._id,
          eventId: event._id,
          title: event.title,
          date: event.date,
          endDate: event.endDate,
          startTime: event.startTime || "09:00 AM", // Default if not specified
          endTime: event.endTime || "05:00 PM", // Default if not specified
          venue: event.venue,
          location: event.location,
          image: event.image,
          slug: event.slug,
          ticketType: submission.formType,
          ticketNumber: ticketNumber,
          price: submission.formType === "attendee" ? event.price || 0 : 0, // Volunteers and speakers don't pay
          status: submission.status,
          submittedAt: submission.createdAt,
          approvedAt: submission.updatedAt,
        }
      })
      .filter(Boolean) // Remove null entries (from deleted events)

    // Sort tickets by date (upcoming first, then past)
    const upcomingTickets = tickets
      .filter((ticket) => new Date(ticket.date) >= currentDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const pastTickets = tickets
      .filter((ticket) => new Date(ticket.date) < currentDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      tickets: {
        upcoming: upcomingTickets,
        past: pastTickets,
        all: tickets,
      },
    })
  } catch (error: any) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch tickets" }, { status: 500 })
  }
}
