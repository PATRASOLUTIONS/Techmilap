import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { logWithTimestamp } from "@/utils/logger"

// Import models
const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", require("@/models/Ticket").default.schema)
const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
const FormSubmission =
  mongoose.models.FormSubmission || mongoose.model("FormSubmission", require("@/models/FormSubmission").default.schema)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const eventId = params.id

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

    // Get check-in stats from FormSubmissions
    const formSubmissionStats = await FormSubmission.aggregate([
      { $match: { eventId: new mongoose.Types.ObjectId(eventId), formType: "attendee", status: "approved" } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          checkedIn: { $sum: { $cond: [{ $eq: ["$isCheckedIn", true] }, 1, 0] } },
        },
      },
    ])

    // Get check-in stats from Tickets
    const ticketStats = await Ticket.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          checkedIn: { $sum: { $cond: [{ $eq: ["$isCheckedIn", true] }, 1, 0] } },
        },
      },
    ])

    // Combine the stats
    const formStats = formSubmissionStats.length > 0 ? formSubmissionStats[0] : { total: 0, checkedIn: 0 }

    // do not need the ticket stats for now
    //
    // const tStats = ticketStats.length > 0 ? ticketStats[0] : { total: 0, checkedIn: 0 }
    //
    // const stats = {
    //   total: formStats.total + tStats.total,
    //   checkedIn: formStats.checkedIn + tStats.checkedIn,
    //   remaining: formStats.total + tStats.total - (formStats.checkedIn + tStats.checkedIn),
    //   percentage:
    //     formStats.total + tStats.total > 0
    //       ? Math.round(((formStats.checkedIn + tStats.checkedIn) / (formStats.total + tStats.total)) * 100)
    //       : 0,
    // }


    // Only sending form submission stats for now
    const stats = {
      total: formStats.total,
      checkedIn: formStats.checkedIn,
      remaining: formStats.total - formStats.checkedIn,
      percentage:
        formStats.total > 0
          ? Math.round((formStats.checkedIn / formStats.total) * 100)
          : 0,
    }

    // Get recent check-ins
    const recentFormCheckIns = await FormSubmission.find(
      { eventId: eventId, formType: "attendee", status: "approved", isCheckedIn: true },
      { userName: 1, userEmail: 1, checkedInAt: 1 },
    )
      .sort({ checkedInAt: -1 })
      .limit(10)
      .lean()

    // Do not need the ticket checkins for now
    // const recentTicketCheckIns = await Ticket.find({ event: eventId, isCheckedIn: true }, { name: 1, checkedInAt: 1 })
    //   .sort({ checkedInAt: -1 })
    //   .limit(10)
    //   .lean()

    //log recent from checkin and recent ticket checkins
    logWithTimestamp("info", "Recent Form Check-Ins:", recentFormCheckIns)

    // Combine and sort recent check-ins
    // const recentCheckIns = [...recentFormCheckIns, ...recentTicketCheckIns] //do not need this ticket checkins for now
    const recentCheckIns = [...recentFormCheckIns]
      .sort((a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime())
      .slice(0, 10)
      .map((checkIn) => ({
        id: checkIn._id,
        name: checkIn.userName || checkIn.name || "Unknown",
        email: checkIn.userEmail || "No email",
        checkedInAt: checkIn.checkedInAt,
      }))

    return NextResponse.json({
      stats,
      recentCheckIns,
    })
  } catch (error: any) {
    console.error("Error fetching check-in stats:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching check-in statistics" },
      { status: 500 },
    )
  }
}
