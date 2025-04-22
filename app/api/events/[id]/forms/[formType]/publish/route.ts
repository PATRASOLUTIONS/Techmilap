import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: Request, { params }: { params: { id: string; formType: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = params.id
    const formType = params.formType // attendee, volunteer, or speaker

    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    const data = await request.json()
    const { status, questions } = data

    console.log(`Publishing ${formType} form with status: ${status}`)
    console.log(`Questions data:`, questions)

    // Validate that we have questions
    if (!questions) {
      return NextResponse.json({ error: "Questions data is missing." }, { status: 400 })
    }

    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: "Questions data must be an array." }, { status: 400 })
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No questions provided. Form must have at least default questions." },
        { status: 400 },
      )
    }

    const client = await connectToDatabase()
    const db = client.db()

    // Get the event to check ownership
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "You do not have permission to update this event" }, { status: 403 })
    }

    // Create the update object with $set to ensure nested fields are properly updated
    const updateObj = {}

    // Set the custom questions
    updateObj[`customQuestions.${formType}`] = questions

    // Set the form status based on formType
    if (formType === "attendee") {
      // If attendeeForm doesn't exist, create it
      if (!event.attendeeForm) {
        updateObj["attendeeForm"] = { status: status || "published" }
      } else {
        updateObj["attendeeForm.status"] = status || "published"
      }
    } else if (formType === "volunteer") {
      // If volunteerForm doesn't exist, create it
      if (!event.volunteerForm) {
        updateObj["volunteerForm"] = { status: status || "published" }
      } else {
        updateObj["volunteerForm.status"] = status || "published"
      }
    } else if (formType === "speaker") {
      // If speakerForm doesn't exist, create it
      if (!event.speakerForm) {
        updateObj["speakerForm"] = { status: status || "published" }
      } else {
        updateObj["speakerForm.status"] = status || "published"
      }
    }

    console.log("Updating event with:", updateObj)

    // Update the database
    const updateResult = await db.collection("events").updateOne({ _id: new ObjectId(eventId) }, { $set: updateObj })

    console.log(`Update result: ${updateResult.matchedCount} matched, ${updateResult.modifiedCount} modified`)

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Fetch the updated event to verify changes
    const updatedEvent = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    console.log("Updated event:", {
      customQuestions: updatedEvent.customQuestions,
      [`${formType}Form`]: updatedEvent[`${formType}Form`],
    })

    // Generate the public URL for the form
    const baseUrl = new URL(request.url).origin
    const formPath = formType === "attendee" ? "register" : formType
    const publicUrl = `${baseUrl}/public-events/${eventId}/${formPath}`

    return NextResponse.json({
      success: true,
      message: `${formType} form ${status === "published" ? "published" : "updated"} successfully`,
      formStatus: updatedEvent[`${formType}Form`]?.status || status,
      questionsCount: updatedEvent.customQuestions?.[formType]?.length || 0,
      publicUrl: status === "published" ? publicUrl : null,
    })
  } catch (error) {
    console.error(`Error ${params.formType} form:`, error)
    return NextResponse.json({ error: "Failed to update form. Please try again." }, { status: 500 })
  }
}
