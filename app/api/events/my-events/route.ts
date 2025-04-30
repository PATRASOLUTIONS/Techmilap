import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const userId = session.user.id
    const searchParams = req.nextUrl.searchParams
    const isPastEvents = searchParams.get("past") === "true"

    // Get current date for filtering past events
    const currentDate = new Date()

    // Find events where the user is an attendee, volunteer, speaker, or organizer
    const events = await Event.aggregate([
      {
        $lookup: {
          from: "registrations",
          localField: "_id",
          foreignField: "event",
          as: "registrations",
        },
      },
      {
        $lookup: {
          from: "formsubmissions",
          localField: "_id",
          foreignField: "eventId",
          as: "submissions",
        },
      },
      {
        $match: {
          $or: [
            { organizer: new mongoose.Types.ObjectId(userId) },
            { "registrations.user": new mongoose.Types.ObjectId(userId) },
            { "submissions.userId": new mongoose.Types.ObjectId(userId) },
          ],
          // Updated date filtering logic
          ...(isPastEvents
            ? {
                $or: [
                  // Events with end date in the past
                  { endDate: { $lt: currentDate } },
                  // Events with no end date but start date in the past
                  { $and: [{ endDate: { $exists: false } }, { date: { $lt: currentDate } }] },
                ],
              }
            : {
                $or: [
                  // Events with end date in the future
                  { endDate: { $gte: currentDate } },
                  // Events with no end date but start date in the future
                  { $and: [{ endDate: { $exists: false } }, { date: { $gte: currentDate } }] },
                  // Events with start date in the past but end date in the future
                  { $and: [{ date: { $lt: currentDate } }, { endDate: { $gte: currentDate } }] },
                ],
              }),
        },
      },
      {
        $addFields: {
          userRole: {
            $cond: {
              if: { $eq: ["$organizer", new mongoose.Types.ObjectId(userId)] },
              then: "organizer",
              else: {
                $cond: {
                  if: {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: "$submissions",
                            as: "submission",
                            cond: {
                              $and: [
                                { $eq: ["$$submission.userId", new mongoose.Types.ObjectId(userId)] },
                                { $eq: ["$$submission.formType", "speaker"] },
                              ],
                            },
                          },
                        },
                      },
                      0,
                    ],
                  },
                  then: "speaker",
                  else: {
                    $cond: {
                      if: {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: "$submissions",
                                as: "submission",
                                cond: {
                                  $and: [
                                    { $eq: ["$$submission.userId", new mongoose.Types.ObjectId(userId)] },
                                    { $eq: ["$$submission.formType", "volunteer"] },
                                  ],
                                },
                              },
                            },
                          },
                          0,
                        ],
                      },
                      then: "volunteer",
                      else: {
                        $cond: {
                          if: {
                            $gt: [
                              {
                                $size: {
                                  $filter: {
                                    input: "$registrations",
                                    as: "registration",
                                    cond: { $eq: ["$$registration.user", new mongoose.Types.ObjectId(userId)] },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                          then: "attendee",
                          else: "visitor",
                        },
                      },
                    },
                  },
                },
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
          location: 1,
          capacity: 1,
          status: 1,
          attendees: 1,
          slug: 1,
          userRole: 1,
          image: 1,
        },
      },
    ]).exec()

    return NextResponse.json({ events })
  } catch (error: any) {
    console.error("Error fetching user events:", error)
    return NextResponse.json(
      {
        error: error.message || "An error occurred while fetching events",
        events: [],
      },
      { status: 500 },
    )
  }
}
