import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import Review from "@/models/Review"
import Event from "@/models/Event"

// Update review status (approve or reject)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only event planners and admins can update review status
    if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { status } = await req.json()

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    await connectToDatabase()

    const review = await Review.findById(params.id)

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // For event planners, check if they own the event
    if (session.user.role === "event-planner") {
      const event = await Event.findById(review.eventId)
      if (!event || event.organizer.toString() !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    // Update the status
    review.status = status
    await review.save()

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error("Error updating review status:", error)
    return NextResponse.json({ error: "Failed to update review status" }, { status: 500 })
  }
}
