import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import FormSubmission from "@/models/FormSubmission"
import Event from "@/models/Event"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    const ticketId = params.id

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    // Find the form submission by ID
    const submission = await FormSubmission.findById(ticketId).lean()

    if (!submission) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Get the associated event
    const event = await Event.findById(submission.eventId).lean()

    // Log the data for debugging
    console.log("Public API - Ticket data:", {
      submissionId: submission._id,
      formType: submission.formType,
      formData: submission.formData ? Object.keys(submission.formData) : [],
      eventId: submission.eventId,
    })

    // Log the full submission data for debugging
    console.log("Full submission data:", JSON.stringify(submission, null, 2))

    // Ensure we're returning the complete submission data
    return NextResponse.json({
      success: true,
      ticket: {
        ...submission,
        // Add these fields explicitly to ensure they're included
        userName:
          submission.userName ||
          submission.user?.name ||
          (submission.formData &&
            (submission.formData.name || submission.formData.fullName || submission.formData.firstName)),
        userEmail:
          submission.userEmail ||
          submission.user?.email ||
          (submission.formData && (submission.formData.email || submission.formData.emailAddress)),
        event: event || null,
      },
    })
  } catch (error) {
    console.error("Error fetching public ticket:", error)
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 })
  }
}
