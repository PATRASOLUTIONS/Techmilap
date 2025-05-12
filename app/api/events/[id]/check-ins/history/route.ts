import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Import models
const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", require("@/models/Ticket").default.schema)
const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
const FormSubmission =
  mongoose.models.FormSubmission || mongoose.model("FormSubmission", require("@/models/FormSubmission").default.schema)
const User = mongoose.models.User || mongoose.model("User", require("@/models/User").default.schema)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const eventId = params.id
    const url = new URL(req.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const skip = (page - 1) * limit
    const search = url.searchParams.get("search") || ""

    // Check if the event exists and the user has permission
    const event = await Event.findById(eventId)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to view check-ins for this event" },
        { status: 403 },
      )
    }

    // Build search query for form submissions
    const formSubmissionQuery: any = {
      eventId: new mongoose.Types.ObjectId(eventId),
      formType: "attendee",
      status: "approved",
    }

    if (search) {
      formSubmissionQuery.$or = [
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ]
    }

    // Get check-ins from FormSubmissions
    const formSubmissionCheckIns = await FormSubmission.find(formSubmissionQuery, {
      _id: 1,
      userName: 1,
      userEmail: 1,
      isCheckedIn: 1,
      checkedInAt: 1,
      checkedInBy: 1,
      checkInCount: 1,
      createdAt: 1,
    })
      .sort({ checkedInAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Build search query for tickets
    const ticketQuery: any = { event: new mongoose.Types.ObjectId(eventId) }

    if (search) {
      ticketQuery.name = { $regex: search, $options: "i" }
    }

    // Get check-ins from Tickets
    const ticketCheckIns = await Ticket.find(ticketQuery, {
      _id: 1,
      name: 1,
      type: 1,
      isCheckedIn: 1,
      checkedInAt: 1,
      checkedInBy: 1,
      checkInCount: 1,
      createdAt: 1,
    })
      .sort({ checkedInAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get staff members who checked in attendees
    const staffIds = [
      ...new Set(
        [
          ...formSubmissionCheckIns.map((c) => c.checkedInBy).filter(Boolean),
          ...ticketCheckIns.map((c) => c.checkedInBy).filter(Boolean),
        ].map((id) => id.toString()),
      ),
    ]

    const staffMembers =
      staffIds.length > 0
        ? await User.find(
            { _id: { $in: staffIds.map((id) => new mongoose.Types.ObjectId(id)) } },
            { firstName: 1, lastName: 1, email: 1 },
          ).lean()
        : []

    const staffMap = staffMembers.reduce((map, staff) => {
      map[staff._id.toString()] = {
        name: `${staff.firstName} ${staff.lastName}`,
        email: staff.email,
      }
      return map
    }, {})

    // Combine and format check-ins
    const formattedFormCheckIns = formSubmissionCheckIns.map((checkIn) => ({
      id: checkIn._id.toString(),
      type: "form_submission",
      name: checkIn.userName || "Unknown",
      email: checkIn.userEmail || "No email",
      ticketType: "Standard",
      isCheckedIn: checkIn.isCheckedIn || false,
      checkedInAt: checkIn.checkedInAt,
      checkInCount: checkIn.checkInCount || 0,
      checkedInBy: checkIn.checkedInBy ? staffMap[checkIn.checkedInBy.toString()] : null,
      createdAt: checkIn.createdAt,
    }))

    const formattedTicketCheckIns = ticketCheckIns.map((checkIn) => ({
      id: checkIn._id.toString(),
      type: "ticket",
      name: checkIn.name || "Unknown",
      email: "N/A", // Tickets might not have email directly
      ticketType: checkIn.type || "Standard",
      isCheckedIn: checkIn.isCheckedIn || false,
      checkedInAt: checkIn.checkedInAt,
      checkInCount: checkIn.checkInCount || 0,
      checkedInBy: checkIn.checkedInBy ? staffMap[checkIn.checkedInBy.toString()] : null,
      createdAt: checkIn.createdAt,
    }))

    // Combine all check-ins and sort by check-in date
    const allCheckIns = [...formattedFormCheckIns, ...formattedTicketCheckIns].sort((a, b) => {
      // First sort by check-in status (checked in first)
      if (a.isCheckedIn && !b.isCheckedIn) return -1
      if (!a.isCheckedIn && b.isCheckedIn) return 1

      // Then sort by check-in date (most recent first)
      if (a.isCheckedIn && b.isCheckedIn) {
        return new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime()
      }

      // For non-checked in, sort by registration date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Get total counts for pagination
    const totalFormSubmissions = await FormSubmission.countDocuments(formSubmissionQuery)
    const totalTickets = await Ticket.countDocuments(ticketQuery)
    const totalItems = totalFormSubmissions + totalTickets

    return NextResponse.json({
      checkIns: allCheckIns,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    })
  } catch (error: any) {
    console.error("Error fetching check-in history:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching check-in history" },
      { status: 500 },
    )
  }
}
