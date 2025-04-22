import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Update the GET method to properly return volunteer form data
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = params.id
    const client = await clientPromise
    const db = client.db()

    // Get the event to check ownership and retrieve form data
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user is organizer or super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json(
        { error: "Unauthorized: You don't have permission to access this form" },
        { status: 403 },
      )
    }

    // Return the volunteer form data from the event
    const volunteerFormStatus = event.volunteerForm?.status || "draft"
    const volunteerQuestions = event.customQuestions?.volunteer || []

    console.log("Returning volunteer form data:", {
      status: volunteerFormStatus,
      customQuestions: volunteerQuestions,
    })

    return NextResponse.json({
      status: volunteerFormStatus,
      customQuestions: volunteerQuestions,
    })
  } catch (error) {
    console.error("Error fetching volunteer form:", error)
    return NextResponse.json({ error: "Failed to fetch volunteer form" }, { status: 500 })
  }
}

// Add a POST method to update the volunteer form
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = params.id
    const client = await clientPromise
    const db = client.db()

    // Get the event to check ownership
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user is organizer or super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json(
        { error: "Unauthorized: You don't have permission to update this form" },
        { status: 403 },
      )
    }

    // Get the form data from the request
    const { status, customQuestions } = await request.json()
    console.log("Received volunteer form data:", { status, customQuestions })

    // Update the event with the new form data
    const result = await db.collection("events").updateOne(
      { _id: new ObjectId(eventId) },
      {
        $set: {
          "volunteerForm.status": status || "draft",
          "customQuestions.volunteer": customQuestions || [],
        },
      },
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update volunteer form" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Volunteer form updated successfully",
      status: status || "draft",
      customQuestions: customQuestions || [],
    })
  } catch (error) {
    console.error("Error updating volunteer form:", error)
    return NextResponse.json({ error: "Failed to update volunteer form" }, { status: 500 })
  }
}
