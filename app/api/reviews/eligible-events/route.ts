import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"

export async function GET(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const userEmail = session.user.email

    console.log("Eligible Events API - User:", userId, "Email:", userEmail)

    // Connect to database
    await connectToDatabase()

    // Import models after database connection is established
    const Event = (await import("@/models/Event")).default
    const Ticket = (await import("@/models/Ticket")).default
    const FormSubmission = (await import("@/models/FormSubmission")).default
    const Review = (await import("@/models/Review")).default

    // Convert userId to ObjectId if possible
    let userObjectId
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        userObjectId = new mongoose.Types.ObjectId(userId)
      } else {
        userObjectId = userId
      }
    } catch (error) {
      console.error("Error converting userId to ObjectId:", error)
      userObjectId = userId
    }

    console.log("Using userObjectId:", userObjectId)

    // APPROACH 1: Find events where user is registered directly in the Event model
    let registeredEvents = []
    try {
      // Try different queries to find events
      const eventQueries = [
        { organizer: userObjectId },
        { attendees: userObjectId },
        { volunteers: userObjectId },
        { speakers: userObjectId },
        { "registrations.userId": userObjectId },
      ]

      // Log the queries we're about to run
      console.log("Running event queries:", JSON.stringify(eventQueries))

      // Run all queries and combine results
      const eventResults = await Promise.all(
        eventQueries.map((query) => Event.find(query).select("_id title date location image").lean()),
      )

      // Combine and deduplicate results
      const allEvents = eventResults.flat()
      const eventIds = new Set()
      registeredEvents = allEvents.filter((event) => {
        if (!event._id) return false
        const id = event._id.toString()
        if (eventIds.has(id)) return false
        eventIds.add(id)
        return true
      })

      console.log(`Found ${registeredEvents.length} registered events from ${allEvents.length} total results`)
    } catch (error) {
      console.error("Error fetching registered events:", error)
      registeredEvents = []
    }

    // APPROACH 2: Find events through tickets
    let ticketEvents = []
    try {
      // Try different queries for tickets
      const ticketQueries = [{ userId: userObjectId }, { userId: userId.toString() }, { email: userEmail }]

      console.log("Running ticket queries:", JSON.stringify(ticketQueries))

      // Run all queries and combine results
      const ticketResults = await Promise.all(
        ticketQueries.map((query) =>
          Ticket.find(query)
            .populate({
              path: "event",
              select: "_id title date location image",
            })
            .lean(),
        ),
      )

      // Extract events from tickets and deduplicate
      const allTicketEvents = ticketResults
        .flat()
        .filter((ticket) => ticket.event) // Filter out tickets with no event
        .map((ticket) => ticket.event)

      const ticketEventIds = new Set()
      ticketEvents = allTicketEvents.filter((event) => {
        if (!event._id) return false
        const id = event._id.toString()
        if (ticketEventIds.has(id)) return false
        ticketEventIds.add(id)
        return true
      })

      console.log(`Found ${ticketEvents.length} ticket events from ${allTicketEvents.length} total results`)
    } catch (error) {
      console.error("Error fetching ticket events:", error)
      ticketEvents = []
    }

    // APPROACH 3: Find events through form submissions
    let submissionEvents = []
    try {
      // Try different queries for form submissions
      const submissionQueries = [
        { userId: userObjectId, status: "approved" },
        { userId: userId.toString(), status: "approved" },
        { userEmail: userEmail, status: "approved" },
      ]

      console.log("Running submission queries:", JSON.stringify(submissionQueries))

      // Run all queries and combine results
      const submissionResults = await Promise.all(
        submissionQueries.map((query) =>
          FormSubmission.find(query)
            .populate({
              path: "eventId",
              select: "_id title date location image",
            })
            .lean(),
        ),
      )

      // Extract events from submissions and deduplicate
      const allSubmissionEvents = submissionResults
        .flat()
        .filter((submission) => submission.eventId) // Filter out submissions with no event
        .map((submission) => submission.eventId)

      const submissionEventIds = new Set()
      submissionEvents = allSubmissionEvents.filter((event) => {
        if (!event._id) return false
        const id = event._id.toString()
        if (submissionEventIds.has(id)) return false
        submissionEventIds.add(id)
        return true
      })

      console.log(`Found ${submissionEvents.length} submission events from ${allSubmissionEvents.length} total results`)
    } catch (error) {
      console.error("Error fetching submission events:", error)
      submissionEvents = []
    }

    // APPROACH 4: Direct database query for all events (fallback)
    let allEvents = []
    try {
      // Get all events as a fallback
      const events = await Event.find({}).select("_id title date location image organizer").lean()

      console.log(`Found ${events.length} total events in database`)

      // Filter to only include events that might be relevant to the user
      allEvents = events.filter((event) => {
        // Include if user is organizer
        if (event.organizer && event.organizer.toString() === userId) {
          return true
        }
        // Include past events (user might have attended)
        const eventDate = new Date(event.date)
        const now = new Date()
        return eventDate < now
      })

      console.log(`Filtered to ${allEvents.length} potentially relevant events`)
    } catch (error) {
      console.error("Error fetching all events:", error)
      allEvents = []
    }

    // Combine all events from different approaches
    const combinedEvents = [...registeredEvents, ...ticketEvents, ...submissionEvents, ...allEvents]

    // Deduplicate the combined events
    const uniqueEventIds = new Set()
    const uniqueEvents = combinedEvents.filter((event) => {
      if (!event || !event._id) return false
      const id = event._id.toString()
      if (uniqueEventIds.has(id)) return false
      uniqueEventIds.add(id)
      return true
    })

    console.log(`Combined ${combinedEvents.length} events, deduplicated to ${uniqueEvents.length} unique events`)

    // Check if the user has already reviewed each event
    let userReviews = []
    try {
      // Try different queries for reviews
      const reviewQueries = [{ userId: userObjectId }, { userId: userId.toString() }]

      const reviewResults = await Promise.all(reviewQueries.map((query) => Review.find(query).lean()))

      userReviews = reviewResults.flat()
      console.log(`Found ${userReviews.length} existing user reviews`)
    } catch (error) {
      console.error("Error fetching user reviews:", error)
      userReviews = []
    }

    const reviewedEventIds = userReviews.map((review) => {
      try {
        return review.eventId.toString()
      } catch (e) {
        return review.eventId
      }
    })

    // Filter out events that have already been reviewed
    const eligibleEvents = uniqueEvents.filter((event) => {
      const eventId = event._id.toString()
      return !reviewedEventIds.includes(eventId)
    })

    console.log(`Filtered to ${eligibleEvents.length} eligible events after removing reviewed events`)

    // Format the response
    const formattedEvents = eligibleEvents.map((event) => ({
      _id: event._id,
      title: event.title,
      date: event.date,
      image: event.image,
    }))

    // If we still have no events, return all events as a last resort
    if (formattedEvents.length === 0) {
      console.log("No eligible events found, returning all events as fallback")
      const allEventsFormatted = uniqueEvents.map((event) => ({
        _id: event._id,
        title: event.title,
        date: event.date,
        image: event.image,
      }))

      return NextResponse.json({
        events: allEventsFormatted,
        message: "No eligible events found, showing all events as fallback",
      })
    }

    return NextResponse.json({
      events: formattedEvents,
    })
  } catch (error) {
    console.error("Error fetching eligible events:", error)
    return NextResponse.json({ error: "Failed to fetch eligible events" }, { status: 500 })
  }
}
