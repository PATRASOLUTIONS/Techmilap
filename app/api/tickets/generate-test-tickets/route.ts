import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"

export async function POST(req: Request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only allow admins to generate test tickets
    if (session.user.role !== "admin" && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    // Connect to database
    await connectToDatabase()

    // Import models after database connection is established
    const Ticket = (await import("@/models/Ticket")).default
    const Event = (await import("@/models/Event")).default
    const User = (await import("@/models/User")).default

    // Get request body
    const body = await req.json()
    const { userId, eventId, count = 1, ticketType = "attendee" } = body

    // Validate inputs
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if event exists
    const event = await Event.findById(eventId)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Generate test tickets
    const tickets = []
    for (let i = 0; i < count; i++) {
      const ticketNumber = `TEST-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

      const ticket = new Ticket({
        userId: new mongoose.Types.ObjectId(userId),
        event: new mongoose.Types.ObjectId(eventId),
        ticketType,
        ticketNumber,
        price: 0,
        status: "confirmed",
        purchasedAt: new Date(),
        name: user.name || "Test User",
        email: user.email || "test@example.com",
      })

      await ticket.save()
      tickets.push(ticket)
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${count} test tickets for user ${userId} and event ${eventId}`,
      tickets,
    })
  } catch (error: any) {
    console.error("Error generating test tickets:", error)
    return NextResponse.json({ error: `Failed to generate test tickets: ${error.message}` }, { status: 500 })
  }
}
