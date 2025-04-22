import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Update the POST function to include the event slug in the response
export async function POST(request: Request, { params }: { params: { id: string; formType: string } }) {
  try {
    const eventId = params.id
    const formType = params.formType
    const { status, questions } = await request.json()

    // Validate form type
    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    // Connect to database
    const client = await connectToDatabase()
    const db = client.db()

    // Get the event
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Update the form status and questions
    const updateData: any = {}
    updateData[`${formType}Form.status`] = status

    // Only update questions if they are provided
    if (questions && Array.isArray(questions)) {
      updateData[`customQuestions.${formType}`] = questions
    }

    // Update the event
    await db.collection("events").updateOne({ _id: new ObjectId(eventId) }, { $set: updateData })

    // Return success response with event slug
    return NextResponse.json({
      success: true,
      message: `${formType} form ${status === "published" ? "published" : "updated"} successfully`,
      eventSlug: event.slug || eventId, // Include the event slug
    })
  } catch (error) {
    console.error(`Error updating ${params.formType} form:`, error)
    return NextResponse.json({ error: "Failed to update form. Please try again." }, { status: 500 })
  }
}
