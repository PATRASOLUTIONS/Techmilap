import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import FormSubmission from "@/models/FormSubmission"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get role filter from query params
    const url = new URL(req.url)
    const roleFilter = url.searchParams.get("role")

    console.log("Connecting to database...")
    await connectToDatabase()
    console.log("Connected to database")

    // Make sure we have a valid user ID and email
    if (!session.user.id || !session.user.email) {
      return NextResponse.json({ error: "Invalid user information", events: [] }, { status: 400 })
    }

    console.log(`Fetching events for user ID: ${session.user.id} and email: ${session.user.email}`)
    console.log(`Role filter: ${roleFilter || "none"}`)

    // Convert string ID to MongoDB ObjectId
    let userId
    try {
      userId = new mongoose.Types.ObjectId(session.user.id)
    } catch (error) {
      console.error("Invalid ObjectId format:", error)
      return NextResponse.json({ error: "Invalid user ID format", events: [] }, { status: 400 })
    }

    // Find all events where the current user is the organizer
    const organizedEvents =
      roleFilter === "organizer" || !roleFilter
        ? await Event.find({ organizer: userId }).sort({ createdAt: -1 }).lean().exec()
        : []

    console.log(`Found ${organizedEvents.length} organized events`)

    // Find events where the user is an attendee (directly in the attendees array)
    const attendeeEvents =
      roleFilter === "attendee" || !roleFilter
        ? await Event.find({ attendees: userId }).sort({ createdAt: -1 }).lean().exec()
        : []

    console.log(`Found ${attendeeEvents.length} events where user is directly in attendees array`)

    // Find form submissions for this user to determine other roles
    const formSubmissions = await FormSubmission.find({
      $or: [{ userId: session.user.id }, { userEmail: session.user.email }],
    })
      .lean()
      .exec()

    console.log(`Found ${formSubmissions.length} form submissions for user`)

    // Group submissions by event and type
    const eventSubmissions = new Map()

    for (const submission of formSubmissions) {
      const eventId = submission.eventId ? submission.eventId.toString() : null
      if (!eventId) continue

      if (!eventSubmissions.has(eventId)) {
        eventSubmissions.set(eventId, { roles: new Set() })
      }

      eventSubmissions.get(eventId).roles.add(submission.formType)
      console.log(`Added role ${submission.formType} for event ${eventId}`)
    }

    // Fetch all events the user has submitted forms for
    const eventIds = Array.from(eventSubmissions.keys())
      .map((id) => {
        try {
          return new mongoose.Types.ObjectId(id)
        } catch (e) {
          console.error(`Invalid event ID: ${id}`)
          return null
        }
      })
      .filter(Boolean)

    console.log(`Fetching ${eventIds.length} events from submissions`)

    const submissionEvents =
      eventIds.length > 0
        ? await Event.find({ _id: { $in: eventIds } })
            .lean()
            .exec()
        : []

    console.log(`Found ${submissionEvents.length} events from submissions`)

    // Add user role to each event from submissions
    const eventsWithRoles = submissionEvents.map((event) => {
      const eventId = event._id.toString()
      const submission = eventSubmissions.get(eventId)
      const roles = submission ? Array.from(submission.roles) : []

      // Determine primary role (prioritize speaker > volunteer > attendee)
      let userRole = "attendee"
      if (roles.includes("speaker")) {
        userRole = "speaker"
      } else if (roles.includes("volunteer")) {
        userRole = "volunteer"
      }

      return {
        ...event,
        userRole,
      }
    })

    // Add attendee role to events where user is directly in attendees array
    const attendeeEventsWithRole = attendeeEvents.map((event) => ({
      ...event,
      userRole: "attendee",
    }))

    // Add organizer role to organized events
    const organizedEventsWithRole = organizedEvents.map((event) => ({
      ...event,
      userRole: "organizer",
    }))

    // Combine all events
    let allEvents = [...organizedEventsWithRole, ...attendeeEventsWithRole, ...eventsWithRoles]

    // Filter by role if specified
    if (roleFilter) {
      allEvents = allEvents.filter((event) => event.userRole === roleFilter)
    }

    // Remove duplicates by event ID
    const eventMap = new Map()
    allEvents.forEach((event) => {
      const eventId = event._id.toString()
      const existingEvent = eventMap.get(eventId)

      // Prioritize roles: organizer > speaker > volunteer > attendee
      if (
        !existingEvent ||
        (existingEvent.userRole === "attendee" && event.userRole !== "attendee") ||
        (existingEvent.userRole === "volunteer" && ["speaker", "organizer"].includes(event.userRole)) ||
        (existingEvent.userRole === "speaker" && event.userRole === "organizer")
      ) {
        eventMap.set(eventId, event)
      }
    })

    const uniqueEvents = Array.from(eventMap.values())
    console.log(`Found ${uniqueEvents.length} total unique events for user`)

    // Transform events to ensure they have all required fields
    const safeEvents = uniqueEvents.map((event) => ({
      _id: event._id.toString(),
      title: event.title || "Untitled Event",
      description: event.description || "",
      date: event.date || new Date(),
      location: event.location || "No location",
      capacity: event.capacity || 0,
      status: event.status || "draft",
      category: event.category || "Other",
      image: event.image || null,
      attendees: Array.isArray(event.attendees) ? event.attendees : [],
      organizer: event.organizer || {},
      slug: event.slug || event._id.toString(),
      userRole: event.userRole || "attendee",
    }))

    return NextResponse.json({ events: safeEvents })
  } catch (error: any) {
    console.error("Error fetching user events:", error)
    return NextResponse.json(
      {
        error: error.message || "An error occurred while fetching events",
        events: [],
      },
      { status: 500 },
    )
  }
}
