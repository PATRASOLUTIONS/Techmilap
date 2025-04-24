import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "@/lib/auth"
import { authOptions } from "@/lib/auth"

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

export async function PATCH(req: NextRequest, { params }: { params: { id: string; formType: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Check if the event exists
    const event = await Event.findById(params.id)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You don't have permission to access this event" }, { status: 403 })
    }

    // Get the request body
    const { submissionIds } = await req.json()

    if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json({ error: "Invalid submission IDs" }, { status: 400 })
    }

    // Update the submissions
    const updateResult = await FormSubmission.updateMany(
      {
        _id: { $in: submissionIds.map((id) => new mongoose.Types.ObjectId(id)) },
        eventId: event._id,
        formType: params.formType,
      },
      {
        status: "approved",
        updatedAt: new Date(),
      },
    )

    if (!updateResult) {
      return NextResponse.json({ error: "Submissions not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `${submissionIds.length} ${params.formType} submissions approved successfully`,
      updatedCount: updateResult.modifiedCount,
    })
  } catch (error: any) {
    console.error(`Error bulk approving ${params.formType} submissions:`, error)
    return NextResponse.json(
      { error: error.message || `An error occurred while bulk approving ${params.formType} submissions` },
      { status: 500 },
    )
  }
}
