import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logWithTimestamp } from "@/utils/logger"
import FormSubmission from "@/models/FormSubmission"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Find event by ID or slug
    let event = await Event.findById(params.id)
    if (!event) {
      event = await Event.findOne({ slug: params.id })
    }
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    logWithTimestamp("info", "Fetching volunteer applications for event:", event)

    // Get query parameters for filtering
    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const search = url.searchParams.get("search")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")

    // Build query for FormSubmission
    const query: any = {
      eventId: event._id,
      formType: "volunteer",
    }
    if (status) query.status = status
    if (search) {
      query.$or = [
        { "data.name": { $regex: search, $options: "i" } },
        { "data.email": { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
        { "data.question_name_0": { $regex: search, $options: "i" } },
        { "data.question_email_0": { $regex: search, $options: "i" } },
      ]
    }

    // Pagination
    const skip = (page - 1) * limit
    const total = await FormSubmission.countDocuments(query)
    const submissions = await FormSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
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
    console.error("Error fetching volunteer applications:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching volunteer applications" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    const { formData, eventId } = await req.json()

    if (!formData) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    const event = await Event.findById(params.id)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the volunteer form is published
    if (!event.volunteerForm || event.volunteerForm.formSettings?.status !== "published") {
      return NextResponse.json({ error: "Volunteer form is not published" }, { status: 400 })
    }

    // Validate required fields based on form configuration
    const requiredFields = event.volunteerForm.formFields.filter((field) => field.required).map((field) => field.id)

    const missingFields = []
    for (const fieldId of requiredFields) {
      if (!formData[fieldId] || (Array.isArray(formData[fieldId]) && formData[fieldId].length === 0)) {
        missingFields.push(fieldId)
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Create a new volunteer application
    if (!event.volunteerApplications) {
      event.volunteerApplications = []
    }

    // Add the new application
    const newApplication = {
      formData,
      status: "pending",
      submittedAt: new Date(),
    }

    event.volunteerApplications.push(newApplication)
    await event.save()

    return NextResponse.json({
      success: true,
      message: "Volunteer application submitted successfully",
    })
  } catch (error: any) {
    console.error("Error submitting volunteer application:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while submitting your application" },
      { status: 500 },
    )
  }
}
