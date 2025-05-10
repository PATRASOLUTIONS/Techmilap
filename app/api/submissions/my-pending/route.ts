import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Connect to database
    const { db } = await connectToDatabase()

    // Find all pending submissions for this user
    const submissions = await db
      .collection("formsubmissions") // Note the lowercase 's'
      .find({
        $or: [{ userId: new ObjectId(userId) }, { userEmail: session.user.email }],
        status: "pending",
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Get event details for each submission
    const submissionsWithEventDetails = await Promise.all(
      submissions.map(async (submission) => {
        let event = null
        try {
          event = await db
            .collection("events")
            .findOne(
              { _id: new ObjectId(submission.eventId) },
              { projection: { title: 1, date: 1, location: 1, slug: 1 } },
            )
        } catch (error) {
          console.error(`Error fetching event for submission ${submission._id}:`, error)
        }

        return {
          ...submission,
          event: event || { title: "Unknown Event", date: null, location: "Unknown Location" },
        }
      }),
    )

    return NextResponse.json({
      submissions: submissionsWithEventDetails,
    })
  } catch (error) {
    console.error("Error fetching pending submissions:", error)
    return NextResponse.json({ error: "Failed to fetch pending submissions. Please try again." }, { status: 500 })
  }
}
