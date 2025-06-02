import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, defineModels } from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"
import { logWithTimestamp } from "@/utils/logger"

// Update the GET function to properly handle speaker form data
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Connect to database
    await connectToDatabase()

    // Define models
    defineModels()

    // Get models
    const Event = mongoose.models.Event
    const User = mongoose.models.User

    // Try to find event by ID or slug
    let event = null

    if (mongoose.isValidObjectId(params.id)) {
      event = await Event.findById(params.id).lean()
    }

    if (!event) {
      event = await Event.findOne({ slug: params.id }).lean()
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Get organizer info
    const organizerInfo = { name: "Event Organizer" }

    if (event.organizer && mongoose.isValidObjectId(event.organizer)) {
      try {
        const organizer = await User.findById(event.organizer).lean()
        if (organizer) {
          if (organizer.firstName || organizer.lastName) {
            organizerInfo.name = `${organizer.firstName || ""} ${organizer.lastName || ""}`.trim()
          } else if (organizer.name) {
            organizerInfo.name = organizer.name
          } else if (organizer.email) {
            organizerInfo.name = organizer.email.split("@")[0]
          }
        }
      } catch (error) {
        console.error("Error fetching organizer:", error)
      }
    }

    logWithTimestamp("info", "Event Data from DB", event);

    // The 'organizer' ObjectId is destructured out as 'eventOrganizerId' (and not used further in this scope)
    // because we are replacing its representation with the derived 'organizerInfo'.
    const { _id, ...restOfEventProperties } = event as any;


    // Prepare response
    const eventData = {
      id: event._id.toString(),
      organizerInfo,
      ...restOfEventProperties
    }

    return NextResponse.json(eventData)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}

// Update the PUT function to properly handle speaker form data
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Define models
    defineModels()

    // Get models
    const Event = mongoose.models.Event

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(params.id)
    let event = null

    if (isValidObjectId) {
      // If it's a valid ObjectId, try to find by ID first
      event = await Event.findById(params.id)
    }

    // If not found by ID or not a valid ObjectId, try to find by slug
    if (!event && !isValidObjectId) {
      event = await Event.findOne({ slug: params.id })
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You don't have permission to update this event" }, { status: 403 })
    }

    const requestData = await req.json()
    const eventData: any = {}

    logWithTimestamp("info", "Event data from DB :", event)

    logWithTimestamp("info", "Request data in event update :", requestData)


    // Update event details
    if (requestData.details) {
      const { title, displayName, description, date, endDate, startTime, endTime, location, category, type, visibility, image, slug } = requestData.details;

      if (title) eventData.title = title;
      if (displayName) eventData.displayName = displayName;
      if (description) eventData.description = description;
      if (date) eventData.date = date;
      if (endDate) eventData.endDate = endDate;
      if (startTime) eventData.startTime = startTime;
      if (endTime) eventData.endTime = endTime;
      if (location) eventData.location = location;
      if (category) eventData.category = category;
      if (type) eventData.type = type;
      if (visibility) eventData.visibility = visibility;
      if (image) eventData.image = image;
      if (slug) eventData.slug = slug;
      if (requestData.details.customQuestions) {
        eventData.customQuestions = requestData.details.customQuestions;
      }
      if (requestData.details.status) {
        eventData.status = requestData.details.status;
      }
      if (requestData.details.attendeeForm) {
        eventData.attendeeForm = requestData.details.attendeeForm
      }
      if (requestData.details.volunteerForm) {
        eventData.volunteerForm = requestData.details.volunteerForm
      }
      if (requestData.details.speakerForm) {
        eventData.speakerForm = requestData.details.speakerForm
      }
    }
    // When updating an event, ensure status is properly set
    if (requestData.status) {
      // If explicitly setting status, use that value
      eventData.status = requestData.status
    } else if (requestData.details?.visibility === "Public" && eventData.status === "draft") {
      // If making a draft event public, automatically publish it
      eventData.status = "published"
    }

    // Update custom questions if provided
    if (requestData.customQuestions) {
      eventData.customQuestions = {
        attendee: Array.isArray(requestData.customQuestions.attendee)
          ? requestData.customQuestions.attendee
          : event.customQuestions?.attendee || [],
        volunteer: Array.isArray(requestData.customQuestions.volunteer)
          ? requestData.customQuestions.volunteer
          : event.customQuestions?.volunteer || [],
        speaker: Array.isArray(requestData.customQuestions.speaker)
          ? requestData.customQuestions.speaker
          : event.customQuestions?.speaker || [],
      }
    }


    // Update tickets if provided
    if (requestData.tickets) {
      eventData.tickets = requestData.tickets;
    }

    logWithTimestamp("info", "Updating event with:", eventData)

    // return;

    const updatedEvent = await Event.findByIdAndUpdate(event._id, eventData, { new: true })

    return NextResponse.json({ success: true, event: updatedEvent })
  } catch (error: any) {
    console.error("Error updating event:", error)
    return NextResponse.json({ error: error.message || "An error occurred while updating the event" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Define models
    defineModels()

    // Get models
    const Event = mongoose.models.Event

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(params.id)
    let event = null

    if (isValidObjectId) {
      // If it's a valid ObjectId, try to find by ID first
      event = await Event.findById(params.id)
    }

    // If not found by ID or not a valid ObjectId, try to find by slug
    if (!event && !isValidObjectId) {
      event = await Event.findOne({ slug: params.id })
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You don't have permission to delete this event" }, { status: 403 })
    }

    await Event.findByIdAndDelete(event._id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: error.message || "An error occurred while deleting the event" }, { status: 500 })
  }
}
