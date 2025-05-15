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
    // Users can view their own reviews
    // Event planners can view reviews for their events
    // Super admins can view all reviews
    if (session.user.role !== "super-admin" && review.userId._id.toString() !== session.user.id) {
      // If user is not the review owner, check if they're the event planner
      if (session.user.role === "event-planner") {
        const event = await Event.findById(review.eventId)
        if (!event || event.organizer.toString() !== session.user.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error("Error fetching review:", error)
    return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 })
  }
}

// Update a review
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rating, title, comment } = await req.json()

    if (!rating || !title || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectToDatabase()

    const review = await Review.findById(params.id)

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Only the review owner can update it
    if (review.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update the review
    review.rating = rating
    review.title = title
    review.comment = comment
    review.status = "pending" // Reset to pending when updated
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

    // Users can delete their own reviews
    // Event planners can delete reviews for their events
    // Super admins can delete any review
    if (session.user.role !== "super-admin" && review.userId.toString() !== session.user.id) {
      // If user is not the review owner, check if they're the event planner
      if (session.user.role === "event-planner") {
        const event = await Event.findById(review.eventId)
        if (!event || event.organizer.toString() !== session.user.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    await Review.findByIdAndDelete(params.id)

    return NextResponse.json({ success: true, message: "Review deleted successfully" })
  } catch (error) {
    console.error("Error deleting review:", error)
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
  }
}
