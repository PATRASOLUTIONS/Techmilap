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

    // Get attendee submissions for this event
    const attendeeSubmissions = await FormSubmission.find({
      eventId: event._id,
      formType: "attendee",
    }).sort({ createdAt: -1 })

    // Get event registrations from the event model
    const eventRegistrations = event.registrations || []

    // Get user details for registrations that have userId
    const userIds = eventRegistrations.map((reg) => reg.userId).filter((id) => id && mongoose.isValidObjectId(id))

    const users =
      userIds.length > 0 ? await User.find({ _id: { $in: userIds } }, "firstName lastName email").lean() : []

    // Create a map of user details by ID for quick lookup
    const userMap = users.reduce((map, user) => {
      map[user._id.toString()] = {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      }
      return map
    }, {})

    // Combine data from both sources
    const combinedRegistrations = [
      // Include form submissions
      ...attendeeSubmissions.map((submission) => ({
        id: submission._id.toString(),
        source: "formSubmission",
        name: submission.userName || "Anonymous",
        email: submission.userEmail || "N/A",
        status: submission.status,
        registeredAt: submission.createdAt,
        data: submission.data,
        userId: submission.userId ? submission.userId.toString() : null,
      })),

      // Include event registrations
      ...eventRegistrations.map((reg) => {
        const userId = reg.userId ? reg.userId.toString() : null
        const user = userId && userMap[userId]

        return {
          id: `reg_${userId || Math.random().toString(36).substring(7)}`,
          source: "eventRegistration",
          name: user ? user.name : "Unknown User",
          email: user ? user.email : "N/A",
          status: reg.status,
          registeredAt: reg.registeredAt,
          data: reg.customResponses ? Object.fromEntries(reg.customResponses) : {},
          userId: userId,
        }
      }),
    ]

    // Remove duplicates (if a user appears in both sources)
    const seen = new Set()
    const uniqueRegistrations = combinedRegistrations.filter((reg) => {
      if (reg.userId && reg.userId !== "null" && reg.userId !== null) {
        if (seen.has(reg.userId)) {
          return false
        }
        seen.add(reg.userId)
      }
      return true
    })

    // Sort by registration date (newest first)
    uniqueRegistrations.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())

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
