import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import FormSubmission from "@/models/FormSubmission" // Assuming this is your Mongoose model
import Event from "@/models/Event" // Assuming this is your Mongoose model

export async function GET(request: Request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Connect to database
    await connectToDatabase()

    // Find all pending submissions for this user
    const submissions = await FormSubmission
      .find({
        $or: [{ userId: new ObjectId(userId) }, { userEmail: session.user.email }],
        status: "pending",
      })
      .sort({ createdAt: -1 })
      .lean() // Use lean for plain JS objects

    // Get event details for each submission
    const submissionsWithEventDetails = await Promise.all(
      submissions.map(async (submission) => {
        let event = null
        try {
          // Ensure submission.eventId is a valid ObjectId string or ObjectId
          // Mongoose findOne can typically handle string ObjectIds
          event = await Event
            .findOne(
              { _id: new ObjectId(submission.eventId) },
            )
            .select({ title: 1, date: 1, location: 1, slug: 1 }) // Mongoose select syntax
            .lean() // Use lean for plain JS objects
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
