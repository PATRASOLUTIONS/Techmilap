import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(request, { params }) {
  try {
    const { id, formType } = params
    const session = await getServerSession(authOptions)

    // Check authentication
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate form type
    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    const body = await request.json()
    const { status, questions } = body

    // Validate status
    if (!["published", "draft"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    await connectToDatabase()

    // Find the event
    const event = await Event.findById(id)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user is authorized to update this event
    const userId = session.user.id
    if (event.createdBy.toString() !== userId && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized to update this event" }, { status: 403 })
    }

    // Update the form status and questions
    const formKey = `${formType}Form`
    event[formKey] = event[formKey] || {}
    event[formKey].status = status
    event[formKey].updatedAt = new Date()

    // Update custom questions if provided
    if (questions && Array.isArray(questions)) {
      event.customQuestions = event.customQuestions || {}
      event.customQuestions[formType] = questions
    }

    await event.save()

    console.log(`Form ${formType} updated with status: ${status} for event: ${id}`)
    console.log(`Number of questions: ${questions ? questions.length : 0}`)

    // Return the updated event with the slug for URL generation
    return NextResponse.json({
      success: true,
      message: `${formType} form ${status === "published" ? "published" : "updated"} successfully`,
      status,
      eventSlug: event.slug,
    })
  } catch (error) {
    console.error("Error updating form:", error)
    return NextResponse.json({ error: "An error occurred while updating the form" }, { status: 500 })
  }
}
