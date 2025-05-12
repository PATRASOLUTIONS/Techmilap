import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { isValidObjectId } from "mongoose"

// Import models
const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
const FormSubmission =
  mongoose.models.FormSubmission ||
  mongoose.model(
    "FormSubmission",
    new mongoose.Schema({
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: { type: String },
      userEmail: { type: String },
      formType: { type: String, required: true, enum: ["attendee", "volunteer", "speaker"] },
      status: { type: String, default: "pending", enum: ["pending", "approved", "rejected"] },
      data: { type: mongoose.Schema.Types.Mixed, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }),
  )

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; formType: string; submissionId: string } },
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate the submissionId is a valid ObjectId
    if (!isValidObjectId(params.submissionId)) {
      return NextResponse.json({ error: `Invalid submission ID format: ${params.submissionId}` }, { status: 400 })
    }

    await connectToDatabase()

    // Check if the event exists
    const event = await Event.findById(params.id)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (
      event.organizer.toString() !== session.user.id &&
      session.user.role !== "admin" &&
      session.user.role !== "super-admin"
    ) {
      return NextResponse.json({ error: "Forbidden: You don't have permission to access this event" }, { status: 403 })
    }

    // Get the request body
    const { status } = await req.json()

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Find and update the submission
    const submission = await FormSubmission.findOneAndUpdate(
      {
        _id: params.submissionId,
        eventId: event._id,
        formType: params.formType,
      },
      {
        status,
        updatedAt: new Date(),
      },
      { new: true },
    )

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `${params.formType} submission status updated to ${status}`,
      submission,
    })
  } catch (error: any) {
    console.error(`Error updating ${params.formType} submission:`, error)
    return NextResponse.json(
      { error: error.message || `An error occurred while updating ${params.formType} submission` },
      { status: 500 },
    )
  }
}
