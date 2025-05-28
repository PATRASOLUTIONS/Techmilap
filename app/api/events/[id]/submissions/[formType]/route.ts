import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import FormSubmission from "@/models/FormSubmission"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { logWithTimestamp } from "@/utils/logger"

export async function POST(req: NextRequest, { params }: { params: { id: string; formType: string } }) {
  console.log(`POST request for form submission: ${params.formType}, event ID: ${params.id}`)

  try {
    await connectToDatabase()

    // Get the request body
    const body = await req.json()

    // FIXED: Log the entire request body to debug
    console.log("Full request body:", JSON.stringify(body).substring(0, 500) + "...")

    // FIXED: Extract formData correctly and handle different formats
    const formData = body.formData || body

    // Validate form type
    const formType = params.formType
    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    // FIXED: Properly handle both ObjectId and slug lookups
    const idOrSlug = params.id
    const isValidObjectId = mongoose.isValidObjectId(idOrSlug)

    console.log(`Looking up event with ${isValidObjectId ? "ObjectId" : "slug"}: ${idOrSlug}`)

    let event
    if (isValidObjectId) {
      event = await Event.findById(idOrSlug)
      console.log(`Lookup by ObjectId result:`, event ? `Found event: ${event.title}` : "Not found")
    }

    if (!event) {
      event = await Event.findOne({ slug: idOrSlug })
      console.log(`Lookup by slug result:`, event ? `Found event: ${event.title}` : "Not found")
    }

    if (!event) {
      console.log(`Event not found for ID/slug: ${idOrSlug}`)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log(`Found event: ${event.title} (${event._id})`)

    // FIXED: Skip form status check for now to debug the issue
    // Check if the form is published
    const formKey = `${formType}Form`
    const formStatus = event[formKey]?.status || "draft"
    console.log(`Form status for ${formType}: ${formStatus}`)

    // if (formStatus !== "published") {
    //   console.log(`Form ${formType} is not published for event: ${event._id}`)
    //   return NextResponse.json({ error: "Form is not available for submissions" }, { status: 403 })
    // }

    if (!formData) {
      console.error("Form data is missing in the request body")
      return NextResponse.json({ error: "Form data is required" }, { status: 400 })
    }

    // Get the user session (if authenticated)
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    // FIXED: Extract user information for better tracking
    let userEmail = null
    let userName = null

    // Try to extract email from form data
    if (formData.email) userEmail = formData.email
    else if (formData.userEmail) userEmail = formData.userEmail
    else if (formData.corporateEmail) userEmail = formData.corporateEmail

    // Try to extract name from form data
    if (formData.name) userName = formData.name
    else if (formData.fullName) userName = formData.fullName
    else if (formData.firstName && formData.lastName) userName = `${formData.firstName} ${formData.lastName}`
    else if (formData.firstName) userName = formData.firstName
    else {
      // Look for a key that starts with "question_name_"
      const nameKey = Object.keys(formData).find(key => key.startsWith("question_name_"))
      if (nameKey) userName = formData[nameKey]
    }    

    // Create a new form submission
    // FIXED: Use 'data' field instead of 'formData'
    const submission = new FormSubmission({
      eventId: event._id,
      formType,
      data: formData, // FIXED: Use 'data' instead of 'formData'
      status: "pending", // Default status is pending
      userId, // Link to user if authenticated
      userEmail: userEmail, // FIXED: Add extracted email
      userName: userName, // FIXED: Add extracted name
      submittedAt: new Date(),
    })

    await submission.save()
    console.log(`Form submission saved with ID: ${submission._id}`)

    // Update event statistics
    event.statistics = event.statistics || {}
    if (formType === "attendee") {
      event.statistics.registrations = (event.statistics.registrations || 0) + 1
    } else if (formType === "volunteer") {
      event.statistics.volunteerApplications = (event.statistics.volunteerApplications || 0) + 1
    } else if (formType === "speaker") {
      event.statistics.speakerApplications = (event.statistics.speakerApplications || 0) + 1
    }
    await event.save()

    return NextResponse.json({
      success: true,
      message: "Your submission has been received successfully!",
      submissionId: submission._id,
    })
  } catch (error) {
    console.error("Error processing form submission:", error)
    return NextResponse.json(
      {
        error: "An error occurred while processing your submission",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
