import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateShortTicketId, formatTicketId } from "@/lib/ticket-utils"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
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
    const names = [
      "John Doe",
      "Jane Smith",
      "Michael Johnson",
      "Emily Davis",
      "Robert Wilson",
      "Sarah Brown",
      "David Miller",
      "Jennifer Taylor",
      "Richard Anderson",
      "Jessica Thomas",
    ]

    const emails = [
      "john.doe@example.com",
      "jane.smith@example.com",
      "michael.johnson@example.com",
      "emily.davis@example.com",
      "robert.wilson@example.com",
      "sarah.brown@example.com",
      "david.miller@example.com",
      "jennifer.taylor@example.com",
      "richard.anderson@example.com",
      "jessica.thomas@example.com",
    ]

    for (let i = 0; i < count; i++) {
      const nameIndex = Math.floor(Math.random() * names.length)
      const emailIndex = Math.floor(Math.random() * emails.length)

      const shortId = generateShortTicketId()
      const formattedId = formatTicketId(shortId)

      const ticket = {
        userId: new ObjectId(session.user.id),
        eventId: new ObjectId(eventId),
        ticketType: "attendee",
        ticketNumber: `TICKET-${Date.now()}-${i}`,
        customId: shortId,
        formattedId: formattedId,
        displayId: formattedId,
        price: 0,
        status: "confirmed",
        purchasedAt: new Date(),
        attendeeName: names[nameIndex],
        attendeeEmail: emails[emailIndex],
        name: names[nameIndex],
        email: emails[emailIndex],
        isCheckedIn: false,
        checkInCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      tickets.push(ticket)
    }

    // Insert the tickets
    const result = await db.collection("tickets").insertMany(tickets)

    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} test tickets generated successfully`,
      tickets: tickets.map((ticket) => ({
        _id: ticket._id,
        name: ticket.attendeeName,
        email: ticket.attendeeEmail,
        ticketNumber: ticket.ticketNumber,
        customId: ticket.customId,
        formattedId: ticket.formattedId,
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
