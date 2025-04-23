import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase, getDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
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

    // Get the database instance
    const db = await getDatabase()

    // Find all form submissions for this user using both ID and email
    // If roleFilter is specified, only get submissions for that role
    const formSubmissionsQuery = {
      $and: [
        {
          $or: [
            // Check for user ID in various formats
            { userId: session.user.id },
            { userId: userId.toString() },
            { user: userId },
            { user: session.user.id },

            // Check for user email in various formats
            { userEmail: session.user.email },
            { email: session.user.email },
            { "user.email": session.user.email },
            { "userData.email": session.user.email },
            { "formData.email": session.user.email },
            { "data.email": session.user.email },

            // Check nested structures that might contain email
            { formData: { $elemMatch: { value: session.user.email, field: "email" } } },
            { answers: { $elemMatch: { value: session.user.email, question: /email/i } } },
            { "data.email": session.user.email },
          ],
        },
      ],
    }

    // Add role filter if specified
    if (roleFilter && roleFilter !== "organizer") {
      formSubmissionsQuery["$and"].push({
        $or: [
          { formType: roleFilter },
          { type: roleFilter },
          { "formData.type": roleFilter },
          { "data.formType": roleFilter },
        ],
      })
    }

    console.log("Form submissions query:", JSON.stringify(formSubmissionsQuery, null, 2))

    const formSubmissions = await db.collection("formSubmissions").find(formSubmissionsQuery).toArray()

    console.log(
      `Found ${formSubmissions.length} form submissions for user${roleFilter ? " with role " + roleFilter : ""}`,
    )

    // Group submissions by event and type with improved logging
    const eventSubmissions = new Map()

    for (const submission of formSubmissions) {
      // Try to get the event ID from various possible fields
      const eventId =
        submission.eventId ||
        submission.event ||
        submission.eventID ||
        (submission.eventData && submission.eventData._id) ||
        (submission.data && submission.data.eventId) ||
        null

      // Try to get the form type from various possible fields
      const formType =
        submission.formType ||
        submission.type ||
        (submission.formData && submission.formData.type) ||
        (submission.data && submission.data.formType) ||
        "attendee"

      if (!eventId) {
        console.log("Submission missing eventId:", submission)
        continue
      }

      const eventIdStr = eventId.toString()

      if (!eventSubmissions.has(eventIdStr)) {
        eventSubmissions.set(eventIdStr, { roles: new Set() })
      }

      eventSubmissions.get(eventIdStr).roles.add(formType)
      console.log(`Added role ${formType} for event ${eventIdStr}`)
    }

    console.log(`Grouped submissions for ${eventSubmissions.size} events`)

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

    const registeredEvents =
      eventIds.length > 0
        ? await Event.find({ _id: { $in: eventIds } })
            .lean()
            .exec()
        : []

    console.log(`Found ${registeredEvents.length} registered events`)

    // Add user role to each event
    const registeredEventsWithRole = registeredEvents.map((event) => {
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

    // Filter registered events by role if specified
    const filteredRegisteredEvents =
      roleFilter && roleFilter !== "organizer"
        ? registeredEventsWithRole.filter((event) => event.userRole === roleFilter)
        : registeredEventsWithRole

    // Combine all events and mark the user's role in each
    const allEvents = [
      ...organizedEvents.map((event) => ({ ...event, userRole: "organizer" })),
      ...filteredRegisteredEvents,
    ]

    // Remove duplicates (if user has multiple roles in the same event, prioritize organizer > speaker > volunteer > attendee)
    const eventMap = new Map()
    allEvents.forEach((event) => {
      const eventId = event._id.toString()
      const existingEvent = eventMap.get(eventId)

      if (
        !existingEvent ||
        (existingEvent.userRole === "attendee" && event.userRole !== "attendee") ||
        (existingEvent.userRole === "volunteer" && (event.userRole === "speaker" || event.userRole === "organizer")) ||
        (existingEvent.userRole === "speaker" && event.userRole === "organizer")
      ) {
        eventMap.set(eventId, event)
      }
    })

    const uniqueEvents = Array.from(eventMap.values())

    console.log(`Found ${uniqueEvents.length} total events for user${roleFilter ? " with role " + roleFilter : ""}`)

    // Transform the events to ensure they have all required fields
    const safeEvents = uniqueEvents.map((event) => ({
      _id: event._id.toString(),
      title: event.title || "Untitled Event",
      date: event.date || new Date(),
      location: event.location || "No location",
      capacity: event.capacity || 0,
      status: event.status || "draft",
      attendees: Array.isArray(event.attendees) ? event.attendees : [],
      customQuestions: event.customQuestions || {},
      createdAt: event.createdAt || new Date(),
      updatedAt: event.updatedAt || new Date(),
      slug: event.slug || event._id.toString(),
      userRole: event.userRole || "attendee",
    }))

    return NextResponse.json({ events: safeEvents })
  } catch (error: any) {
    console.error("Error fetching user events:", error)

    // Provide more specific error messages based on the error type
    let errorMessage = error.message || "An error occurred while fetching events"
    const statusCode = 500

    if (error.name === "MongooseServerSelectionError") {
      errorMessage = "Database connection timed out. Please try again later."
    } else if (error.name === "MongooseError" && error.message.includes("timed out")) {
      errorMessage = "Database operation timed out. Please try again later."
    }

    return NextResponse.json(
      {
        error: errorMessage,
        events: [],
      },
      { status: statusCode },
    )
  }
}
