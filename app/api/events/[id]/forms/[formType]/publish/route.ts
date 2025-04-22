import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: { id: string; formType: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = params.id
    const formType = params.formType

    // Validate form type
    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    const { status, questions } = await request.json()

    // Validate status
    if (!["draft", "published"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Validate questions
    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: "Questions must be an array" }, { status: 400 })
    }

    const client = await connectToDatabase()
    const db = client.db()

    // Get the event
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer
    if (event.organizer.toString() !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update the form status and questions
    const updateField = `${formType}Form`
    const updateCustomQuestions = `customQuestions.${formType}`

    const updateResult = await db.collection("events").updateOne(
      { _id: new ObjectId(eventId) },
      {
        $set: {
          [updateField]: { status },
          [updateCustomQuestions]: questions,
        },
      },
    )

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update form" }, { status: 500 })
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: `${formType} form ${status === "published" ? "published" : "saved as draft"} successfully`,
      event: {
        _id: event._id,
        title: event.title,
        slug: event.slug,
      },
    })
  } catch (error) {
    console.error("Error publishing form:", error)
    return NextResponse.json({ error: "Failed to publish form" }, { status: 500 })
  }
}
