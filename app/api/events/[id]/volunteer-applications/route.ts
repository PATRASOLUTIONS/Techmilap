import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const event = await Event.findById(params.id).lean()

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get query parameters for filtering
    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const search = url.searchParams.get("search")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")

    // Get the applications
    const applications = event.volunteerApplications || []

    // Apply filters manually (since we're working with a lean document)
    let filteredApplications = applications

    if (status) {
      filteredApplications = filteredApplications.filter((app) => app.status === status)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredApplications = filteredApplications.filter(
        (app) =>
          (app.formData.name && app.formData.name.toLowerCase().includes(searchLower)) ||
          (app.formData.email && app.formData.email.toLowerCase().includes(searchLower)),
      )
    }

    // Pagination
    const skip = (page - 1) * limit
    const paginatedApplications = filteredApplications.slice(skip, skip + limit)
    const total = filteredApplications.length

    return NextResponse.json({
      applications: paginatedApplications,
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

    // Check if the event date has passed
    if (new Date(event.date) < new Date()) {
      console.log("Event date has passed, volunteer applications are not allowed")
      return NextResponse.json({ error: "This event has already occurred" }, { status: 400 })
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
