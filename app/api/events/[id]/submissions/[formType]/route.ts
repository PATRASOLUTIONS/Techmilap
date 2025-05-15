import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import FormSubmission from "@/models/FormSubmission"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: { id: string; formType: string } }) {
  console.log(`POST request for form submission: ${params.formType}, event ID: ${params.id}`)

  try {
    await connectToDatabase()

    // Get the request body
    const body = await req.json()

    // Validate form type
    const formType = params.formType
    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    // Find the event by ID or slug
    const idOrSlug = params.id
    const isValidObjectId = mongoose.isValidObjectId(idOrSlug)

    let event
    if (isValidObjectId) {
      event = await Event.findById(idOrSlug)
    }

    if (!event) {
      event = await Event.findOne({ slug: idOrSlug })
    }

    if (!event) {
      console.log(`Event not found for ID/slug: ${idOrSlug}`)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log(`Found event: ${event.title} (${event._id})`)

    // Check if the form is published
    const formKey = `${formType}Form`
    const formStatus = event[formKey]?.status || "draft"

    if (formStatus !== "published") {
      console.log(`Form ${formType} is not published for event: ${event._id}`)
      return NextResponse.json({ error: "Form is not available for submissions" }, { status: 403 })
    }

    // Get the form data from the request body
    const formData = body.formData

    if (!formData) {
      return NextResponse.json({ error: "Form data is required" }, { status: 400 })
    }

    // Get the user session (if authenticated)
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    // Create a new form submission
    const submission = new FormSubmission({
      event: event._id,
      formType,
      formData,
      status: "pending", // Default status is pending
      userId, // Link to user if authenticated
      submittedAt: new Date(),
    })

    await submission.save()
    console.log(`Form submission saved with ID: ${submission._id}`)

    return NextResponse.json({
      success: true,
      message: "Your submission has been received successfully!",
      submissionId: submission._id,
    })
  } catch (error) {
    console.error("Error processing form submission:", error)
    return NextResponse.json({ error: "An error occurred while processing your submission" }, { status: 500 })
  }
}
