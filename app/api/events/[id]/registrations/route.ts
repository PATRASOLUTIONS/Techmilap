import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Define the models if they don't exist
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

const User = mongoose.models.User || mongoose.model("User", require("@/models/User").default.schema)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = params.id

    // Connect to the database
    await connectToDatabase()

    // Validate the event ID and check permissions
    let event = null

    // Check if the ID is a valid MongoDB ObjectId
    if (mongoose.isValidObjectId(eventId)) {
      event = await Event.findById(eventId)
    }

    // If not found by ID, try to find by slug
    if (!event) {
      event = await Event.findOne({ slug: eventId })
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get query parameters for filtering
    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const search = url.searchParams.get("search")

    // Build the query for attendee submissions
    const query: any = {
      eventId: event._id,
      formType: "attendee",
    }

    if (status) {
      query.status = status
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
        { "data.name": { $regex: search, $options: "i" } },
        { "data.firstName": { $regex: search, $options: "i" } },
        { "data.lastName": { $regex: search, $options: "i" } },
        { "data.email": { $regex: search, $options: "i" } },
      ]
    }

    // Fetch the attendee submissions
    const attendeeSubmissions = await FormSubmission.find(query).sort({ createdAt: -1 })

    // Format the data for the frontend
    const formattedSubmissions = attendeeSubmissions.map((submission: any) => ({
      id: submission._id.toString(),
      name:
        submission.userName ||
        submission.data?.name ||
        submission.data?.firstName + " " + submission.data?.lastName ||
        "Anonymous",
      email: submission.userEmail || submission.data?.email || "N/A",
      status: submission.status,
      registeredAt: submission.createdAt,
      data: submission.data || {},
      userId: submission.userId ? submission.userId.toString() : null,
    }))

    // Return the formatted data
    return NextResponse.json({
      registrations: formattedSubmissions,
      count: formattedSubmissions.length,
    })
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 })
  }
}
