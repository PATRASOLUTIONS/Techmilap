import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { eventId, count = 5 } = await req.json()

    if (!eventId) {
      return NextResponse.json({ success: false, message: "Event ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if the event exists
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    // Generate test tickets
    const tickets = []
    const now = new Date()

    for (let i = 0; i < count; i++) {
      // Generate a unique ticket code with a prefix
      const ticketCode = `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

      const ticket = {
        _id: new ObjectId(),
        eventId: new ObjectId(eventId),
        ticketCode,
        attendeeName: `Test Attendee ${i + 1}`,
        attendeeEmail: `test${i + 1}@example.com`,
        ticketType: "Regular",
        price: 0,
        currency: "USD",
        isCheckedIn: false,
        createdAt: now,
        updatedAt: now,
        isTestTicket: true,
      }

      tickets.push(ticket)
    }

    // Insert the tickets
    const result = await db.collection("tickets").insertMany(tickets)

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${tickets.length} test tickets`,
      tickets: tickets.map((ticket) => ({
        _id: ticket._id,
        ticketCode: ticket.ticketCode,
        attendeeName: ticket.attendeeName,
        attendeeEmail: ticket.attendeeEmail,
      })),
    })
  } catch (error: any) {
    console.error("Error generating test tickets:", error)
    return NextResponse.json(
      { success: false, message: `Error generating test tickets: ${error.message}` },
      { status: 500 },
    )
  }
}
