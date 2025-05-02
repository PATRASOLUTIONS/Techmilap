import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import Review from "@/models/Review"
import Event from "@/models/Event"

// Get a specific review
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const review = await Review.findById(params.id)
      .populate("eventId", "title date location image")
      .populate("userId", "firstName lastName email profileImage")

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Check if the user has permission to view this review
    if (session.user.role === "user" && review.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (session.user.role === "event-planner") {
      // Check if the event belongs to this planner
      const event = await Event.findById(review.eventId)
      if (!event || event.organizer.toString() !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error("Error fetching review:", error)
    return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 })
  }
}

// Update a review (user can update their own review, admin can update any review)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rating, title, comment } = await req.json()

    await connectToDatabase()

    const review = await Review.findById(params.id)

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Only the review author can update the review content
    if (review.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update the review
    if (rating) review.rating = rating
    if (title) review.title = title
    if (comment) review.comment = comment

    // Reset status to pending if content was changed
    review.status = "pending"

    await review.save()

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
  }
}

// Delete a review
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const review = await Review.findById(params.id)

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Only the review author or admin can delete the review
    if (review.userId.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await review.deleteOne()

    return NextResponse.json({ success: true, message: "Review deleted successfully" })
  } catch (error) {
    console.error("Error deleting review:", error)
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
  }
}
