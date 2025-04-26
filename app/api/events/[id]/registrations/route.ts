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

const User = mongoose.models.User || mongoose.model("User", require("@/models/User").default.schema)

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

    // Get attendee submissions for this event
    const submissionQuery: any = {
      eventId: event._id,
      formType: "attendee",
    }

    if (status) {
      submissionQuery.status = status
    }

    if (search) {
      submissionQuery.$or = [
        { "data.name": { $regex: search, $options: "i" } },
        { "data.firstName": { $regex: search, $options: "i" } },
        { "data.lastName": { $regex: search, $options: "i" } },
        { "data.email": { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ]
    }

    // Enhanced filtering for custom fields
    for (const [key, value] of url.searchParams.entries()) {
      if (key.startsWith("filter_")) {
        const fieldName = key.replace("filter_", "")

        // Handle different types of filters
        if (value === "true") {
          // Boolean true
          submissionQuery[`data.${fieldName}`] = true
        } else if (value === "false") {
          // Boolean false
          submissionQuery[`data.${fieldName}`] = false
        } else if (value.startsWith("range:")) {
          // Range filter (e.g., range:10-20)
          const [min, max] = value.replace("range:", "").split("-").map(Number)
          submissionQuery[`data.${fieldName}`] = { $gte: min, $lte: max }
        } else if (value.startsWith("date:")) {
          // Date filter (e.g., date:2023-01-01)
          const dateValue = value.replace("date:", "")
          const startDate = new Date(dateValue)
          startDate.setHours(0, 0, 0, 0)

          const endDate = new Date(dateValue)
          endDate.setHours(23, 59, 59, 999)

          submissionQuery[`data.${fieldName}`] = { $gte: startDate, $lte: endDate }
        } else if (value.startsWith("in:")) {
          // Multiple values (e.g., in:value1,value2,value3)
          const values = value.replace("in:", "").split(",")
          submissionQuery[`data.${fieldName}`] = { $in: values }
        } else {
          // For text fields, use regex for partial matching
          submissionQuery[`data.${fieldName}`] = { $regex: value, $options: "i" }
        }
      }
    }

    const attendeeSubmissions = await FormSubmission.find(submissionQuery).sort({ createdAt: -1 })

    // Get event registrations from the event model
    const eventRegistrations = event.registrations || []

    // Filter event registrations if needed
    let filteredEventRegistrations = eventRegistrations

    if (status) {
      filteredEventRegistrations = filteredEventRegistrations.filter((reg: any) => reg.status === status)
    }

    if (search) {
      // We'll need to get user details to filter by name/email
      // This is a simplified approach - in a real app, you might want to optimize this
      const userIds = filteredEventRegistrations.map((reg: any) => reg.userId).filter(Boolean)
      const users = userIds.length > 0 ? await User.find({ _id: { $in: userIds } }).lean() : []

      const userMap = users.reduce((map: any, user: any) => {
        map[user._id.toString()] = user
        return map
      }, {})

      filteredEventRegistrations = filteredEventRegistrations.filter((reg: any) => {
        if (!reg.userId) return false
        const user = userMap[reg.userId.toString()]
        if (!user) return false

        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
        const searchTerm = search.toLowerCase()

        return fullName.includes(searchTerm) || user.email.toLowerCase().includes(searchTerm)
      })
    }

    // Get user details for registrations that have userId
    const userIds = filteredEventRegistrations
      .map((reg: any) => reg.userId)
      .filter((id) => id && mongoose.isValidObjectId(id))

    const users =
      userIds.length > 0 ? await User.find({ _id: { $in: userIds } }, "firstName lastName email").lean() : []

    // Create a map of user details by ID for quick lookup
    const userMap = users.reduce((map: any, user: any) => {
      map[user._id.toString()] = {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      }
      return map
    }, {})

    // Combine data from both sources
    const combinedRegistrations = [
      // Include form submissions
      ...attendeeSubmissions.map((submission: any) => ({
        id: submission._id.toString(),
        _id: submission._id.toString(),
        source: "formSubmission",
        name: submission.userName || "Anonymous",
        email: submission.userEmail || "N/A",
        status: submission.status,
        registeredAt: submission.createdAt,
        createdAt: submission.createdAt,
        data: submission.data,
        userId: submission.userId ? submission.userId.toString() : null,
      })),

      // Include event registrations
      ...filteredEventRegistrations.map((reg: any) => {
        const userId = reg.userId ? reg.userId.toString() : null
        const user = userId && userMap[userId]

        return {
          id: `reg_${userId || Math.random().toString(36).substring(7)}`,
          _id: `reg_${userId || Math.random().toString(36).substring(7)}`,
          source: "eventRegistration",
          name: user ? user.name : "Unknown User",
          email: user ? user.email : "N/A",
          status: reg.status,
          registeredAt: reg.registeredAt,
          createdAt: reg.registeredAt,
          data: reg.customResponses ? Object.fromEntries(reg.customResponses) : {},
          userId: userId,
        }
      }),
    ]

    // Apply custom field filtering to the combined results
    let filteredRegistrations = combinedRegistrations

    // Apply custom field filters to the combined results
    for (const [key, value] of url.searchParams.entries()) {
      if (key.startsWith("filter_")) {
        const fieldName = key.replace("filter_", "")

        filteredRegistrations = filteredRegistrations.filter((reg: any) => {
          const fieldValue = reg.data[fieldName]
          if (fieldValue === undefined) return false

          if (value === "true") {
            return fieldValue === true
          } else if (value === "false") {
            return fieldValue === false
          } else if (value.startsWith("range:")) {
            const [min, max] = value.replace("range:", "").split("-").map(Number)
            const numValue = Number(fieldValue)
            return numValue >= min && numValue <= max
          } else if (value.startsWith("date:")) {
            const dateValue = value.replace("date:", "")
            const targetDate = new Date(dateValue)
            const fieldDate = new Date(fieldValue)

            return fieldDate.toDateString() === targetDate.toDateString()
          } else if (value.startsWith("in:")) {
            const values = value.replace("in:", "").split(",")
            return values.includes(String(fieldValue))
          } else {
            return String(fieldValue).toLowerCase().includes(value.toLowerCase())
          }
        })
      }
    }

    // Remove duplicates (if a user appears in both sources)
    const seen = new Set()
    const uniqueRegistrations = filteredRegistrations.filter((reg: any) => {
      if (reg.userId && reg.userId !== "null" && reg.userId !== null) {
        if (seen.has(reg.userId)) {
          return false
        }
        seen.add(reg.userId)
      }
      return true
    })

    // Sort by registration date (newest first)
    uniqueRegistrations.sort(
      (a: any, b: any) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
    )

    return NextResponse.json({
      registrations: uniqueRegistrations,
      totalCount: uniqueRegistrations.length,
    })
  } catch (error: any) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching registrations" },
      { status: 500 },
    )
  }
}
