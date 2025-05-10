import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import FormSubmission from "@/models/FormSubmission"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"
import { sendEmail } from "@/lib/email-service"
import { getEmailTemplate } from "@/lib/email-template-service"

export async function POST(request: NextRequest, { params }: { params: { id: string; formType: string } }) {
  try {
    const eventId = params.id
    const formType = params.formType // attendee, volunteer, or speaker

    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    // Connect to database
    await connectToDatabase()

    // Get the session - but make it optional for public form submissions
    const session = await getServerSession(authOptions)

    // Parse the request body
    const { formData } = await request.json()

    if (!formData) {
      return NextResponse.json({ error: "No form data provided" }, { status: 400 })
    }

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(eventId)

    // Get the event
    let event
    if (isValidObjectId) {
      event = await Event.findById(eventId).lean()
    }

    // If not found by ID or not a valid ObjectId, try to find by slug
    if (!event) {
      event = await Event.findOne({ slug: eventId }).lean()
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the event is published
    if (event.status !== "published" && event.status !== "active") {
      return NextResponse.json({ error: "This event is not currently accepting submissions" }, { status: 403 })
    }

    // Check if the form is published
    let formStatus = "draft"
    if (formType === "attendee") {
      formStatus = event.attendeeForm?.status || "draft"
    } else if (formType === "volunteer") {
      formStatus = event.volunteerForm?.status || "draft"
    } else if (formType === "speaker") {
      formStatus = event.speakerForm?.status || "draft"
    }

    if (formStatus !== "published") {
      return NextResponse.json({ error: "This form is not currently accepting submissions" }, { status: 403 })
    }

    // Check if event has already started or passed
    const now = new Date()
    const eventDate = new Date(event.date)

    // If event has a start time, use it for comparison
    if (event.startTime) {
      const [hours, minutes] = event.startTime.split(":").map(Number)
      eventDate.setHours(hours, minutes, 0, 0)
    }

    const isEventPassed = now >= eventDate

    // If event has passed, reject the submission
    if (isEventPassed) {
      return NextResponse.json(
        { error: "This form is closed because the event has already started or passed" },
        { status: 403 },
      )
    }

    // Create a new submission
    const submission = new FormSubmission({
      event: event._id,
      formType,
      formData,
      status: "pending",
      submittedBy: session?.user?.id || null, // Make user ID optional
      submitterEmail: formData.email || session?.user?.email || null, // Use form email if available
      submitterName: formData.name || session?.user?.name || null, // Use form name if available
      submissionDate: new Date(),
    })

    await submission.save()

    // Send confirmation email if email is provided
    if (formData.email) {
      try {
        // Get the appropriate email template
        let templateType = ""
        if (formType === "attendee") templateType = "registration_confirmation"
        else if (formType === "volunteer") templateType = "volunteer_application_confirmation"
        else if (formType === "speaker") templateType = "speaker_application_confirmation"

        if (templateType) {
          const template = await getEmailTemplate(templateType)
          if (template) {
            // Prepare email data
            const emailData = {
              eventTitle: event.title,
              eventDate: event.date ? new Date(event.date).toLocaleDateString() : "TBA",
              eventLocation: event.location || "TBA",
              recipientName: formData.name || "Participant",
              submissionId: submission._id.toString(),
              // Add any other variables needed for the template
            }

            // Send the email
            await sendEmail({
              to: formData.email,
              subject: `${event.title} - ${
                formType === "attendee"
                  ? "Registration Confirmation"
                  : formType === "volunteer"
                    ? "Volunteer Application Received"
                    : "Speaker Application Received"
              }`,
              html: template.content,
              data: emailData,
            })
          }
        }
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError)
        // Don't fail the submission if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully",
      submissionId: submission._id,
    })
  } catch (error: any) {
    console.error(`Error submitting ${params.formType} form:`, error)
    return NextResponse.json({ error: error.message || "Failed to submit form. Please try again." }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string; formType: string } }) {
  try {
    const eventId = params.id
    const formType = params.formType // attendee, volunteer, or speaker

    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    // Connect to database
    await connectToDatabase()

    // Get the session - but make it optional for public form submissions
    const session = await getServerSession(authOptions)

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(eventId)

    // Get the event
    let event
    if (isValidObjectId) {
      event = await Event.findById(eventId).lean()
    }

    // If not found by ID or not a valid ObjectId, try to find by slug
    if (!event) {
      event = await Event.findOne({ slug: eventId }).lean()
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // For organizers and admins, return all submissions
    if (session && (event.organizer.toString() === session.user.id || session.user.role === "super-admin")) {
      const submissions = await FormSubmission.find({
        event: event._id,
        formType,
      }).sort({ submissionDate: -1 })

      return NextResponse.json({ submissions })
    }
    // For logged-in users, return only their submissions
    else if (session) {
      const submissions = await FormSubmission.find({
        event: event._id,
        formType,
        submittedBy: session.user.id,
      }).sort({ submissionDate: -1 })

      return NextResponse.json({ submissions })
    }
    // For public users, return a message that they need to be logged in to view submissions
    else {
      return NextResponse.json({
        message: "You need to be logged in to view your submissions",
        submissions: [],
      })
    }
  } catch (error: any) {
    console.error(`Error fetching ${params.formType} submissions:`, error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch submissions. Please try again." },
      { status: 500 },
    )
  }
}
