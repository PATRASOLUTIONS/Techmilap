import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = params.id
    await connectToDatabase()
    const client = await connectToDatabase()
    const db = client.db()

    // Get the event
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You don't have permission to access this form" }, { status: 403 })
    }

    // Return the form statuses and event slug
    return NextResponse.json({
      attendeeForm: event.attendeeForm || { status: "draft" },
      volunteerForm: event.volunteerForm || { status: "draft" },
      speakerForm: event.speakerForm || { status: "draft" },
      eventSlug: event.slug || null,
    })
  } catch (error) {
    console.error("Error fetching form status:", error)
    return NextResponse.json({ error: "Failed to fetch form status" }, { status: 500 })
  }
}
