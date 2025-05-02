import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import Event from "@/models/Event"
import FormSubmission from "@/models/FormSubmission"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const userId = session.user.id

    // Get current date for filtering
    const currentDate = new Date()

    // Find all events where the user is an attendee, volunteer, or speaker with approved status
    const [attendeeEvents, volunteerSubmissions, speakerSubmissions] = await Promise.all([
      // Find events where user is an approved attendee
      Event.aggregate([
        {
          $lookup: {
            from: "registrations",
            localField: "_id",
            foreignField: "event",
            as: "registrations",
          },
        },
        {
          $match: {
            "registrations.user": new mongoose.Types.ObjectId(userId),
            "registrations.status": "approved",
          },
        },
        {
          $addFields: {
            userRole: "attendee",
            registrationInfo: {
              $filter: {
                input: "$registrations",
                as: "reg",
                cond: {
                  $and: [
                    { $eq: ["$$reg.user", new mongoose.Types.ObjectId(userId)] },
                    { $eq: ["$$reg.status", "approved"] },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            date: 1,
            endDate: 1,
            location: 1,
            venue: 1,
            image: 1,
            slug: 1,
            userRole: 1,
            registrationInfo: { $arrayElemAt: ["$registrationInfo", 0] },
            ticketType: "attendee",
          },
        },
      ]),

      // Find approved volunteer submissions
      FormSubmission.find({
        userId: userId,
        formType: "volunteer",
        status: "approved",
      }).populate({
        path: "eventId",
        select: "_id title date endDate location venue image slug",
      }),

      // Find approved speaker submissions
      FormSubmission.find({
        userId: userId,
        formType: "speaker",
        status: "approved",
      }).populate({
        path: "eventId",
        select: "_id title date endDate location venue image slug",
      }),
    ])

    // Format volunteer submissions as tickets
    const volunteerTickets = volunteerSubmissions.map((submission) => {
      const event = submission.eventId
      return {
        _id: event._id,
        title: event.title,
        date: event.date,
        endDate: event.endDate,
        location: event.location,
        venue: event.venue,
        image: event.image,
        slug: event.slug,
        userRole: "volunteer",
        submissionInfo: {
          _id: submission._id,
          submittedAt: submission.createdAt,
          approvedAt: submission.updatedAt,
        },
        ticketType: "volunteer",
      }
    })

    // Format speaker submissions as tickets
    const speakerTickets = speakerSubmissions.map((submission) => {
      const event = submission.eventId
      return {
        _id: event._id,
        title: event.title,
        date: event.date,
        endDate: event.endDate,
        location: event.location,
        venue: event.venue,
        image: event.image,
        slug: event.slug,
        userRole: "speaker",
        submissionInfo: {
          _id: submission._id,
          submittedAt: submission.createdAt,
          approvedAt: submission.updatedAt,
        },
        ticketType: "speaker",
      }
    })

    // Combine all tickets
    const allTickets = [...attendeeEvents, ...volunteerTickets, ...speakerTickets]

    // Sort tickets by date (upcoming first, then past)
    const upcomingTickets = allTickets
      .filter((ticket) => new Date(ticket.date) >= currentDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const pastTickets = allTickets
      .filter((ticket) => new Date(ticket.date) < currentDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      tickets: {
        upcoming: upcomingTickets,
        past: pastTickets,
      },
    })
  } catch (error: any) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch tickets" }, { status: 500 })
  }
}
