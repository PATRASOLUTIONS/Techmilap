import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: { id: string; formType: string } }) {
  console.log(`GET request for form type: ${params.formType}, event ID: ${params.id}`)

  try {
    await connectToDatabase()

    // Check if this is a form request (public access)
    const isFormRequest = req.headers.get("x-form-request") === "true"

    // Get the session if not a form request
    const session = isFormRequest ? null : await getServerSession(authOptions)

    // Validate form type
    const formType = params.formType
    if (!["register", "attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    // Normalize form type (register and attendee are the same)
    const normalizedFormType = formType === "register" ? "attendee" : formType

    // Find the event by ID or slug
    const idOrSlug = params.id
    const isValidObjectId = mongoose.isValidObjectId(idOrSlug)

    let event
    if (isValidObjectId) {
      event = await Event.findById(idOrSlug).lean()
    }

    if (!event) {
      event = await Event.findOne({ slug: idOrSlug }).lean()
    }

    if (!event) {
      console.log(`Event not found for ID/slug: ${idOrSlug}`)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log(`Found event: ${event.title} (${event._id})`)

    // For public requests, only return published events
    if (isFormRequest && event.status !== "published" && event.status !== "active") {
      console.log(`Public request for non-published event: ${event._id}`)
      return NextResponse.json({ error: "Event not found or not published" }, { status: 404 })
    }

    // Check form status
    const formKey = `${normalizedFormType}Form`
    const formStatus = event[formKey]?.status || "draft"

    // Get custom questions for this form type
    const customQuestions = event.customQuestions?.[normalizedFormType] || []

    // Prepare response data
    const responseData = {
      eventId: event._id,
      eventTitle: event.title,
      eventDate: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.venue,
      capacity: event.capacity,
      questions: customQuestions,
      status: formStatus,
    }

    console.log(`Returning form data for ${normalizedFormType} with status: ${formStatus}`)
    console.log(`Number of questions: ${customQuestions.length}`)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error fetching form data:", error)
    return NextResponse.json({ error: "An error occurred while fetching form data" }, { status: 500 })
  }
}
