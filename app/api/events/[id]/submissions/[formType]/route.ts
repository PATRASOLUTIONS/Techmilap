import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { handleFormSubmission } from "@/lib/form-submission"

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

export async function GET(req: NextRequest, { params }: { params: { id: string; formType: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    console.log(`Fetching ${params.formType} submissions for event: ${params.id}`)

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
    const limit = Number.parseInt(url.searchParams.get("limit") || "100")

    // Build the query
    const query: any = {
      eventId: event._id,
      formType: params.formType,
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

    // Enhanced filtering for custom fields
    // Look for parameters that start with filter_
    for (const [key, value] of url.searchParams.entries()) {
      if (key.startsWith("filter_")) {
        const fieldName = key.replace("filter_", "")

        // Handle different types of filters
        if (value === "true") {
          // Boolean true
          query[`data.${fieldName}`] = true
        } else if (value === "false") {
          // Boolean false
          query[`data.${fieldName}`] = false
        } else if (value.startsWith("range:")) {
          // Range filter (e.g., range:10-20)
          const [min, max] = value.replace("range:", "").split("-").map(Number)
          query[`data.${fieldName}`] = { $gte: min, $lte: max }
        } else if (value.startsWith("date:")) {
          // Date filter (e.g., date:2023-01-01)
          const dateValue = value.replace("date:", "")
          const startDate = new Date(dateValue)
          startDate.setHours(0, 0, 0, 0)

          const endDate = new Date(dateValue)
          endDate.setHours(23, 59, 59, 999)

          query[`data.${fieldName}`] = { $gte: startDate, $lte: endDate }
        } else if (value.startsWith("in:")) {
          // Multiple values (e.g., in:value1,value2,value3)
          const values = value.replace("in:", "").split(",")
          query[`data.${fieldName}`] = { $in: values }
        } else {
          // For text fields, use regex for partial matching
          query[`data.${fieldName}`] = { $regex: value, $options: "i" }
        }
      }
    }

    console.log("Query:", JSON.stringify(query, null, 2))

    // Get total count for pagination
    const total = await FormSubmission.countDocuments(query)

    // Get submissions with pagination
    const submissions = await FormSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    console.log(`Found ${submissions.length} ${params.formType} submissions`)

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
    console.error(`Error fetching ${params.formType} submissions:`, error)
    return NextResponse.json(
      { error: error.message || `An error occurred while fetching ${params.formType} submissions` },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; formType: string } },
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    const { id: eventIdOrSlug, formType } = params
    const { data } = await request.json()

    if (!data) {
      return NextResponse.json({ error: "No form data provided" }, { status: 400 })
    }

    // Validate form type
    const validFormTypes = ["attendee", "volunteer", "speaker"]
    if (!validFormTypes.includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    console.log(`Processing ${formType} submission for event ${eventIdOrSlug}`)

    // Handle the form submission
    const result = await handleFormSubmission(eventIdOrSlug, formType, data, userId)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      submissionId: result.submissionId,
    })
  } catch (error) {
    console.error(`Error processing ${params.formType} submission:`, error)
    return NextResponse.json({ error: "An error occurred while processing your submission" }, { status: 500 })
  }
}
