import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { extractNameFromFormData, extractEmailFromFormData } from "@/lib/ticket-utils"

// Import models
const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
const FormSubmission =
  mongoose.models.FormSubmission || mongoose.model("FormSubmission", require("@/models/FormSubmission").default.schema)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const eventId = params.id

    // Check if the event exists and the user has permission
    const event = await Event.findById(eventId)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to view attendees for this event" },
        { status: 403 },
      )
    }

    // Get all approved attendee submissions
    const submissions = await FormSubmission.find({
      eventId: eventId,
      formType: "attendee",
      status: "approved",
    }).sort({ createdAt: -1 })

    // Process submissions to extract names and emails
    const attendees = submissions.map((submission) => {
      const formData = submission.formData || {}
      const name = extractNameFromFormData(formData, submission)
      const email = extractEmailFromFormData(formData, submission)

      return {
        _id: submission._id,
        name: name || submission.userName || "Unknown",
        email: email || submission.userEmail || "No email",
        isCheckedIn: submission.isCheckedIn || false,
        checkInCount: submission.checkInCount || 0,
        checkedInAt: submission.checkedInAt,
        formData: formData,
      }
    })

    return NextResponse.json({
      success: true,
      attendees,
    })
  } catch (error: any) {
    console.error("Error fetching attendees:", error)
    return NextResponse.json({ error: error.message || "An error occurred while fetching attendees" }, { status: 500 })
  }
}
