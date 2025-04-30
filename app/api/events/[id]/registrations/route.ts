import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const eventId = params.id

    // Verify the user has access to this event
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
      userId: session.user.id,
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 })
    }

    // Get all registrations for this event
    const registrations = await db
      .collection("registrations")
      .find({ eventId: eventId })
      .sort({ createdAt: -1 })
      .toArray()

    // Get all form submissions for this event to merge with registrations
    const formSubmissions = await db
      .collection("formSubmissions")
      .find({
        eventId: eventId,
        formType: "attendee",
      })
      .toArray()

    // Create a map of form submissions by userId for quick lookup
    const submissionsByUserId = {}
    formSubmissions.forEach((submission) => {
      if (submission.userId) {
        submissionsByUserId[submission.userId.toString()] = submission
      }
    })

    // Merge registration data with form submission data
    const enrichedRegistrations = registrations.map((registration) => {
      // Convert registration to a plain object that can be modified
      const regObj = JSON.parse(JSON.stringify(registration))

      // If this registration has form data directly, use it
      if (!regObj.formData || Object.keys(regObj.formData).length === 0) {
        // Try to find a matching form submission
        const userSubmission = submissionsByUserId[regObj.userId?.toString()]
        if (userSubmission) {
          regObj.formData = userSubmission.formData || {}
        }
      }

      return regObj
    })

    return NextResponse.json(enrichedRegistrations)
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
