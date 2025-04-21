import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const id = params.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    const event = await Event.findById(id)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if event is published
    if (event.status !== "published") {
      return NextResponse.json({ error: "This event is not available for registration" }, { status: 400 })
    }

    // Check if event is at capacity
    if (event.attendees.length >= event.capacity) {
      return NextResponse.json({ error: "This event is at full capacity" }, { status: 400 })
    }

    // Check if user is already registered
    if (event.attendees.includes(session.user.id)) {
      return NextResponse.json({ error: "You are already registered for this event" }, { status: 400 })
    }

    // Add user to attendees
    event.attendees.push(session.user.id)
    await event.save()

    return NextResponse.json({ success: true, message: "Successfully registered for event" })
  } catch (error: any) {
    console.error("Error registering for event:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while registering for the event" },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const id = params.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    const event = await Event.findById(id)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user is registered
    if (!event.attendees.includes(session.user.id)) {
      return NextResponse.json({ error: "You are not registered for this event" }, { status: 400 })
    }

    // Remove user from attendees
    event.attendees = event.attendees.filter(
      (attendeeId: mongoose.Types.ObjectId) => attendeeId.toString() !== session.user.id,
    )
    await event.save()

    return NextResponse.json({ success: true, message: "Successfully canceled registration" })
  } catch (error: any) {
    console.error("Error canceling registration:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while canceling registration" },
      { status: 500 },
    )
  }
}
