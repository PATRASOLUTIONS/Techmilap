import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import Ticket from "@/models/Ticket" // Import the Ticket model
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"

// Update the GET function to properly handle speaker form data
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`GET request for event ID/slug: ${params.id}`)
    await connectToDatabase()

    // Check if we're requesting public access
    const isPublicRequest = req.headers.get("x-public-request") === "true"

    // Also check for form-related requests which should be public
    const isFormRequest =
      req.headers.get("x-form-request") === "true" ||
      req.url.includes("/forms/") ||
      req.url.includes("/register") ||
      req.url.includes("/volunteer") ||
      req.url.includes("/speaker")

    // If it's a form request, treat it as public
    const session = isPublicRequest || isFormRequest ? null : await getServerSession(authOptions)

    let event = null
    const idOrSlug = params.id

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(idOrSlug)

    if (isValidObjectId) {
      // If it's a valid ObjectId, try to find by ID first
      console.log(`Looking up event by ID: ${idOrSlug}`)
      event = await Event.findById(idOrSlug).lean()
    }

    // If not found by ID or not a valid ObjectId, try to find by slug
    if (!event) {
      console.log(`Event not found by ID or not a valid ObjectId, trying slug: ${idOrSlug}`)
      event = await Event.findOne({ slug: idOrSlug }).lean()
    }

    if (!event) {
      console.log(`Event not found for ID/slug: ${idOrSlug}`)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log(`Found event: ${event.title} (${event._id})`)

    // For public requests, only return published events
    if ((isPublicRequest || isFormRequest) && event.status !== "published" && event.status !== "active") {
      console.log(`Public request for non-published event: ${event._id}`)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // For authenticated requests, check permissions
    if (!isPublicRequest && !isFormRequest && session) {
      // Check if the user is the organizer or a super-admin
      if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
        console.log(`Permission denied for user ${session.user.id} on event ${event._id}`)
        return NextResponse.json(
          { error: "Forbidden: You don't have permission to access this event" },
          { status: 403 },
        )
      }
    }

    // Ensure form status fields exist
    event.attendeeForm = event.attendeeForm || { status: "draft" }
    event.volunteerForm = event.volunteerForm || { status: "draft" }
    event.speakerForm = event.speakerForm || { status: "draft" }

    // Fetch tickets for the event
    const tickets = await Ticket.find({ event: event._id }).lean()

    // Add tickets to the event object
    event.tickets = tickets

    console.log(`Returning event data with form statuses:`, {
      attendee: event.attendeeForm.status,
      volunteer: event.volunteerForm.status,
      speaker: event.speakerForm.status,
    })

    // Fetch custom questions
    const customQuestions = event.customQuestions || { attendee: [], volunteer: [], speaker: [] }

    // Ensure all necessary fields are included in the response
    const eventData = {
      ...event,
      customQuestions: event.customQuestions || { attendee: [], volunteer: [], speaker: [] },
      attendeeForm: event.attendeeForm || { status: "draft" },
      volunteerForm: event.volunteerForm || { status: "draft" },
      speakerForm: event.speakerForm || { status: "draft" },
      tickets: tickets || [],
      type: event.type || "Offline",
      visibility: event.visibility || "Public",
      category: event.category || "",
      venue: event.venue || "",
      image: event.image || "",
    }

    return NextResponse.json({ event: eventData })
  } catch (error: any) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ error: error.message || "An error occurred while fetching the event" }, { status: 500 })
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

    // Update the event with the new data
    const { title, description, date, location, capacity, price, category } = requestData

    if (title) eventData.title = title
    if (description) eventData.description = description
    if (date) eventData.date = date
    if (location) eventData.location = location
    if (capacity) eventData.capacity = capacity
    if (price) eventData.price = price
    if (category) eventData.category = category

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

    // Update form status if provided
    if (requestData.attendeeForm) {
      eventData.attendeeForm = requestData.attendeeForm
    }
    if (requestData.volunteerForm) {
      eventData.volunteerForm = requestData.volunteerForm
    }
    if (requestData.speakerForm) {
      eventData.speakerForm = requestData.speakerForm
    }

    console.log("Updating event with:", eventData)

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
