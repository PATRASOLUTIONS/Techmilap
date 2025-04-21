import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only allow super admins or the event organizer to access debug info
    if (session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 })
    }

    const eventId = params.id

    const client = await connectToDatabase()
    const db = client.db()

    // Get the event with all form data
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Extract only the relevant form data for debugging
    const formData = {
      eventId: event._id,
      title: event.title,
      slug: event.slug,
      status: event.status,
      attendeeForm: event.attendeeForm || { status: "draft" },
      volunteerForm: event.volunteerForm || { status: "draft" },
      speakerForm: event.speakerForm || { status: "draft" },
      customQuestions: {
        attendee: (event.customQuestions?.attendee || []).length,
        volunteer: (event.customQuestions?.volunteer || []).length,
        speaker: (event.customQuestions?.speaker || []).length,
      },
      rawData: {
        attendeeForm: event.attendeeForm,
        volunteerForm: event.volunteerForm,
        speakerForm: event.speakerForm,
      },
    }

    return NextResponse.json(formData)
  } catch (error: any) {
    console.error("Error fetching debug info:", error)
    return NextResponse.json({ error: error.message || "An error occurred while fetching debug info" }, { status: 500 })
  }
}
