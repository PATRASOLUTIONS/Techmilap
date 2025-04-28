import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    if (!event) {
      event = await Event.findOne({ slug: params.id })
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You don't have permission to access this event" }, { status: 403 })
    }

    // Get attendee submissions for this event
    const attendeeSubmissions = await FormSubmission.find({
      eventId: event._id,
      formType: "attendee",
    }).lean()

    // Extract unique values for each field
    const options: { [key: string]: Set<string> } = {}

    attendeeSubmissions.forEach((submission) => {
      if (submission.data) {
        Object.entries(submission.data).forEach(([key, value]) => {
          if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            if (!options[key]) {
              options[key] = new Set()
            }
            options[key].add(String(value))
          }
        })
      }
    })

    // Convert Sets to Arrays for JSON serialization
    const serializedOptions: { [key: string]: string[] } = {}
    Object.entries(options).forEach(([key, valueSet]) => {
      serializedOptions[key] = Array.from(valueSet)
    })

    return NextResponse.json({
      options: serializedOptions,
      totalFields: Object.keys(serializedOptions).length,
    })
  } catch (error: any) {
    console.error("Error fetching field options:", error)
    // Return empty options instead of an error to prevent client-side crashes
    return NextResponse.json({
      options: {},
      totalFields: 0,
      error: error.message || "An error occurred while fetching field options",
    })
  }
}
