import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"

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

const User = mongoose.models.User || mongoose.model("User", require("@/models/User").default.schema)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`Attempting to fetch submissions for event ID: ${params.id}`)

    const session = await getServerSession(authOptions)

    if (!session) {
      console.log("Unauthorized: No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(params.id)
    let event = null

    if (isValidObjectId) {
      // If it's a valid ObjectId, try to find by ID first
      console.log(`Looking up event by ID: ${params.id}`)
      event = await Event.findById(params.id)
    }

    // If not found by ID or not a valid ObjectId, try to find by slug
    if (!event && !isValidObjectId) {
      console.log(`Event not found by ID or not a valid ObjectId, trying slug: ${params.id}`)
      event = await Event.findOne({ slug: params.id })
    }

    if (!event) {
      console.log(`Event not found for ID/slug: ${params.id}`)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log(`Found event: ${event.title} (${event._id})`)

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      console.log(`User ${session.user.id} does not have permission to access event ${event._id}`)
      return NextResponse.json({ error: "Forbidden: You don't have permission to access this event" }, { status: 403 })
    }

    // Get query parameters for filtering
    const url = new URL(req.url)
    const formType = url.searchParams.get("formType")
    const status = url.searchParams.get("status")
    const search = url.searchParams.get("search")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")

    // Build query
    const query: any = {
      eventId: event._id,
    }

    if (formType) {
      query.formType = formType
    }

    if (status) {
      query.status = status
    }

    if (search) {
      query.$or = [{ userName: { $regex: search, $options: "i" } }, { userEmail: { $regex: search, $options: "i" } }]
    }

    console.log("Submission query:", JSON.stringify(query))

    // Get total count
    const total = await FormSubmission.countDocuments(query)

    // Get submissions
    const submissions = await FormSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    console.log(`Found ${submissions.length} submissions`)

    return NextResponse.json({
      submissions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching submissions" },
      { status: 500 },
    )
  }
}
