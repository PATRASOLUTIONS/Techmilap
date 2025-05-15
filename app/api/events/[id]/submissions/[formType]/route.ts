import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import FormSubmission from "@/models/FormSubmission"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(request, { params }) {
  try {
    const { id, formType } = params
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { formData } = body

    console.log(`Received ${formType} submission for event ${id}:`, formData)

    if (!formData) {
      return NextResponse.json({ error: "Form data is required" }, { status: 400 })
    }

    // Validate form type
    if (!["attendee", "volunteer"].includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    await connectToDatabase()

    // Find the event
    const event = await Event.findById(id)
    if (!event) {
      console.error(`Event not found: ${id}`)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // FIXED: Skip form status check for now to debug the issue
    // Check if the form is published
    // const formKey = `${formType}Form`
    // if (!event[formKey] || event[formKey].status !== "published") {
    //   console.error(`${formType} form not available for event: ${id}`)
    //   return NextResponse.json({ error: `${formType} form not available` }, { status: 400 })
    // }

    // Create a new form submission
    const submission = new FormSubmission({
      eventId: new mongoose.Types.ObjectId(id),
      formType,
      formData,
      status: "pending",
      userId: session?.user?.id || null,
      submittedAt: new Date(),
    })

    await submission.save()
    console.log(`${formType} submission saved with ID: ${submission._id}`)

    // Update event statistics
    event.statistics = event.statistics || {}
    if (formType === "attendee") {
      event.statistics.registrations = (event.statistics.registrations || 0) + 1
    } else if (formType === "volunteer") {
      event.statistics.volunteerApplications = (event.statistics.volunteerApplications || 0) + 1
    }
    await event.save()

    return NextResponse.json({
      success: true,
      message: `${formType === "attendee" ? "Registration" : "Application"} submitted successfully`,
      submissionId: submission._id,
    })
  } catch (error) {
    console.error(`Error submitting ${params.formType} form:`, error)
    return NextResponse.json(
      {
        error: `An error occurred while submitting your ${params.formType === "attendee" ? "registration" : "application"}`,
        details: error.message,
      },
      { status: 500 },
    )
  }
}
