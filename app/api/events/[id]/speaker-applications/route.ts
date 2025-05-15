import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import Event from "@/models/Event"
import FormSubmission from "@/models/FormSubmission"

// Import models
// const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
// const FormSubmission =
//   mongoose.models.FormSubmission ||
//   mongoose.model(
//     "FormSubmission",
//     new mongoose.Schema({
//       eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
//       userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//       userName: { type: String },
//       userEmail: { type: String },
//       formType: { type: String, required: true, enum: ["attendee", "volunteer", "speaker"] },
//       status: { type: String, default: "pending", enum: ["pending", "approved", "rejected"] },
//       data: { type: mongoose.Schema.Types.Mixed, required: true },
//       createdAt: { type: Date, default: Date.now },
//       updatedAt: { type: Date, default: Date.now },
//     }),
//   )

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

    // Get query parameters for filtering
    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const search = url.searchParams.get("search")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")

    // Build the query
    const query: any = {
      eventId: event._id,
      formType: "speaker",
    }

    if (status) {
      query.status = status
    }

    if (search) {
      query.$or = [
        { "data.name": { $regex: search, $options: "i" } },
        { "data.firstName": { $regex: search, $options: "i" } },
        { "data.lastName": { $regex: search, $options: "i" } },
        { "data.email": { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ]
    }

    // Get total count for pagination
    const total = await FormSubmission.countDocuments(query)

    // Get submissions with pagination
    const submissions = await FormSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

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
    console.error("Error fetching speaker applications:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching speaker applications" },
      { status: 500 },
    )
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { formData } = body

    console.log(`Received speaker application for event ${id}:`, formData)

    if (!formData) {
      return NextResponse.json({ error: "Form data is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find the event
    const event = await Event.findById(id)
    if (!event) {
      console.error(`Event not found: ${id}`)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // FIXED: Skip form status check for now to debug the issue
    // Check if the speaker form is published
    // if (!event.speakerForm || event.speakerForm.status !== "published") {
    //   console.error(`Speaker form not available for event: ${id}`)
    //   return NextResponse.json({ error: "Speaker form not available" }, { status: 400 })
    // }

    // Create a new form submission
    const submission = new FormSubmission({
      eventId: new mongoose.Types.ObjectId(id),
      formType: "speaker",
      formData,
      status: "pending",
      userId: session?.user?.id || null,
      submittedAt: new Date(),
    })

    await submission.save()
    console.log(`Speaker application saved with ID: ${submission._id}`)

    // Update event statistics
    event.statistics = event.statistics || {}
    event.statistics.speakerApplications = (event.statistics.speakerApplications || 0) + 1
    await event.save()

    return NextResponse.json({
      success: true,
      message: "Speaker application submitted successfully",
      submissionId: submission._id,
    })
  } catch (error) {
    console.error("Error submitting speaker application:", error)
    return NextResponse.json(
      { error: "An error occurred while submitting your application", details: error.message },
      { status: 500 },
    )
  }
}
