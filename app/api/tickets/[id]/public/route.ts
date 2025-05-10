import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import FormSubmission from "@/models/FormSubmission"
import Event from "@/models/Event"
import { extractNameFromFormData, extractEmailFromFormData, formatEventDate } from "@/lib/ticket-utils"

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

    if (!event) {
      return NextResponse.json({ error: "Event not found for this ticket" }, { status: 404 })
    }

    // Log the data for debugging
    console.log("Public API - Ticket data:", {
      submissionId: submission._id,
      formType: submission.formType,
      formData: submission.formData ? Object.keys(submission.formData) : [],
      eventId: submission.eventId,
      userName: submission.userName,
      userEmail: submission.userEmail,
    })

    // Extract name and email from form data
    const name = extractNameFromFormData(submission.formData, submission)
    const email = extractEmailFromFormData(submission.formData, submission)

    // Format the event date
    const formattedDate = formatEventDate(event.date)

    // Return the ticket data
    return NextResponse.json({
      success: true,
      ticket: {
        ...submission,
        // Add these fields explicitly to ensure they're included
        displayName: name,
        displayEmail: email,
        formattedDate: formattedDate,
        event: {
          ...event,
          formattedDate: formattedDate,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching public ticket:", error)
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 })
  }
}
