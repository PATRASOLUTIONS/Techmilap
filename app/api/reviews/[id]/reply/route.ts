import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import Review from "@/models/Review"
import Event from "@/models/Event"

// Add or update a reply to a review
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only event planners and admins can reply to reviews
    if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { text } = await req.json()

    if (!text) {
      return NextResponse.json({ error: "Reply text is required" }, { status: 400 })
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

    // Add or update the reply
    review.reply = {
      text,
      createdAt: new Date(),
    }

    await review.save()

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error("Error replying to review:", error)
    return NextResponse.json({ error: "Failed to reply to review" }, { status: 500 })
  }
}

// Delete a reply
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only event planners and admins can delete replies
    if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
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

    // Remove the reply
    review.reply = undefined
    await review.save()

    return NextResponse.json({ success: true, message: "Reply deleted successfully" })
  } catch (error) {
    console.error("Error deleting reply:", error)
    return NextResponse.json({ error: "Failed to delete reply" }, { status: 500 })
  }
}
