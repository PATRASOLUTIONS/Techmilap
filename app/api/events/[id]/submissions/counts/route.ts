import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import Event from "@/models/Event"
import FormSubmission from "@/models/FormSubmission"


export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to MongoDB directly
    await connectToDatabase()

    // Convert string ID to ObjectId if possible
    let eventId;
    let event;
    try {
      eventId = new ObjectId(params.id)
      event = await Event.findOne({ _id: eventId })
    } catch (error) {
      // If not a valid ObjectId, try to find by slug
      event = await Event.findOne({ slug: params.id })
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }
      eventId = event._id
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    const organizerId = event.organizer.toString()
    if (organizerId !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You don't have permission to access this event" }, { status: 403 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const formType = url.searchParams.get("type")

    // Define form types to count
    const formTypes = formType ? [formType] : ["attendee", "volunteer", "speaker"]

    // Initialize counts object
    const counts: any = {}

    // Get counts for each form type
    for (const type of formTypes) {
      // Get total count
      const total = await FormSubmission.countDocuments({ eventId, formType: type })

      // Get pending count
      const pending = await FormSubmission.countDocuments({ eventId, formType: type, status: "pending" })

      // Get approved count
      const approved = await FormSubmission.countDocuments({
        eventId: eventId,
        formType: type,
        status: "approved",
      })

      // Get rejected count
      const rejected = await FormSubmission.countDocuments({
        eventId: eventId,
        formType: type,
        status: "rejected",
      })

      // Add counts to result
      counts[type] = {
        total,
        pending,
        approved,
        rejected,
      }
    }

    return NextResponse.json(counts)
  } catch (error) {
    console.error("Error fetching submission counts:", error)
    return NextResponse.json({ error: "An error occurred while fetching submission counts" }, { status: 500 })
  }
}
