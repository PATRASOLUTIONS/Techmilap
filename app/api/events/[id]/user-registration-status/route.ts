import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"

// Import models
const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
const FormSubmission =
  mongoose.models.FormSubmission || mongoose.model("FormSubmission", require("@/models/FormSubmission").default.schema)

export async function GET(req: Request, { params }: { params: { id: string } }) {
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

    const userId = session.user.id
    const userEmail = session.user.email

    // Check if user is an attendee
    const isAttendee = event.attendees && event.attendees.some((attendee: any) => attendee.toString() === userId)

    // Check form submissions
    const attendeeSubmission = await FormSubmission.findOne({
      eventId: event._id,
      formType: "attendee",
      $or: [{ userId }, { userEmail }],
    })

    const volunteerSubmission = await FormSubmission.findOne({
      eventId: event._id,
      formType: "volunteer",
      $or: [{ userId }, { userEmail }],
    })

    const speakerSubmission = await FormSubmission.findOne({
      eventId: event._id,
      formType: "speaker",
      $or: [{ userId }, { userEmail }],
    })

    return NextResponse.json({
      isAttendee: isAttendee || !!attendeeSubmission,
      isVolunteer: !!volunteerSubmission,
      isSpeaker: !!speakerSubmission,
    })
  } catch (error: any) {
    console.error("Error checking user registration status:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
