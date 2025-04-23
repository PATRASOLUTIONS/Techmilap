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
    const organizedEvents = await Event.find({ organizer: userId }).sort({ createdAt: -1 }).lean().exec()
    console.log(`Found ${organizedEvents.length} organized events`)

    // Find events where the user is an attendee (directly in the attendees array)
    const attendeeEvents = await Event.find({ attendees: userId }).sort({ createdAt: -1 }).lean().exec()
    console.log(`Found ${attendeeEvents.length} events where user is directly in attendees array`)

    // Find form submissions for this user to determine other roles
    const formSubmissions = await FormSubmission.find({
      $or: [{ userId: session.user.id }, { userEmail: session.user.email }, { "data.email": session.user.email }],
    })
      .lean()
      .exec()

    console.log(`Found ${formSubmissions.length} form submissions for user`)

    // Group submissions by event and type
    const eventRolesMap = new Map()

    // First, add organizer roles
    organizedEvents.forEach((event) => {
      const eventId = event._id.toString()
      eventRolesMap.set(eventId, {
        event,
        roles: new Set(["organizer"]),
      })
    })

    // Add attendee roles from direct attendees array
    attendeeEvents.forEach((event) => {
      const eventId = event._id.toString()
      if (eventRolesMap.has(eventId)) {
        eventRolesMap.get(eventId).roles.add("attendee")
      } else {
        eventRolesMap.set(eventId, {
          event,
          roles: new Set(["attendee"]),
        })
      }
    })

    // Add roles from form submissions
    for (const submission of formSubmissions) {
      const eventId = submission.eventId ? submission.eventId.toString() : null
      if (!eventId) continue

      // If we already have this event, add the role
      if (eventRolesMap.has(eventId)) {
        eventRolesMap.get(eventId).roles.add(submission.formType)
      } else {
        // Otherwise, fetch the event and add it with this role
        try {
          const event = await Event.findById(eventId).lean().exec()
          if (event) {
            eventRolesMap.set(eventId, {
              event,
              roles: new Set([submission.formType]),
            })
          }
        } catch (err) {
          console.error(`Error fetching event ${eventId}:`, err)
        }
      }
    }

    console.log(`Found ${eventRolesMap.size} total events with roles`)

    // Create multiple versions of events for different roles
    const eventsWithRoles = []

    eventRolesMap.forEach(({ event, roles }, eventId) => {
      // For each role the user has in this event, create a separate event object
      roles.forEach((role) => {
        eventsWithRoles.push({
          ...event,
          _id: event._id.toString(),
          userRole: role,
        })
      })
    })

    console.log(`Created ${eventsWithRoles.length} event entries with roles`)

    // Filter by role if specified
    let filteredEvents = eventsWithRoles
    if (roleFilter) {
      filteredEvents = eventsWithRoles.filter((event) => event.userRole === roleFilter)
      console.log(`Filtered to ${filteredEvents.length} events with role ${roleFilter}`)
    }

    // Transform events to ensure they have all required fields
    const safeEvents = filteredEvents.map((event) => ({
      _id: event._id,
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
      slug: event.slug || event._id,
      userRole: event.userRole,
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
