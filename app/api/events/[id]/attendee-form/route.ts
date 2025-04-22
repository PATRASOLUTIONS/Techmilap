import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const eventId = params.id

    const event = await Event.findById(eventId).lean()
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You don't have permission to access this form" }, { status: 403 })
    }

    // Return the form data with proper defaults
    return NextResponse.json({
      customQuestions: event.customQuestions?.attendee || [],
      status: event.attendeeForm?.status || "draft",
    })
  } catch (error: any) {
    console.error("Error fetching attendee form:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching the attendee form" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const eventId = params.id

    const event = await Event.findById(eventId)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You don't have permission to update this form" }, { status: 403 })
    }

    const { customQuestions, status } = await req.json()
    console.log("Received form data:", { customQuestions, status })

    // Initialize the customQuestions object if it doesn't exist
    if (!event.customQuestions) {
      event.customQuestions = { attendee: [], volunteer: [], speaker: [] }
    }

    // Update the attendee questions
    event.customQuestions.attendee = customQuestions || []

    // Initialize the attendeeForm object if it doesn't exist
    if (!event.attendeeForm) {
      event.attendeeForm = { status: "draft" }
    }

    // Update the form status
    event.attendeeForm.status = status || "draft"

    await event.save()
    console.log("Updated event with form data:", {
      attendeeQuestions: event.customQuestions.attendee,
      status: event.attendeeForm.status,
    })

    return NextResponse.json({
      success: true,
      message: "Attendee form updated successfully",
      customQuestions: event.customQuestions.attendee,
      status: event.attendeeForm.status,
    })
  } catch (error: any) {
    console.error("Error updating attendee form:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while updating the attendee form" },
      { status: 500 },
    )
  }
}
