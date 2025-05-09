import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { ticketId, ticketType, formType } = data

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    let ticketData

    if (ticketType === "submission") {
      // Get form submission data
      const submission = await db.collection("formSubmissions").findOne({
        _id: ticketId,
        userId: session.user.id,
      })

      if (!submission) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 })
      }

      // Get event data
      const event = await db.collection("events").findOne({
        _id: submission.eventId,
      })

      ticketData = {
        ...submission,
        event,
        formType: formType || submission.formType,
      }
    } else {
      // Get regular ticket data
      const ticket = await db.collection("tickets").findOne({
        _id: ticketId,
        userId: session.user.id,
      })

      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
      }

      // Get event data
      const event = await db.collection("events").findOne({
        _id: ticket.eventId,
      })

      ticketData = {
        ...ticket,
        event,
      }
    }

    // Instead of generating a PDF on the server, we'll return the ticket data
    // and generate the PDF on the client side using jspdf
    return NextResponse.json({
      success: true,
      ticket: ticketData,
    })
  } catch (error) {
    console.error("Error processing ticket data:", error)
    return NextResponse.json({ error: "Failed to process ticket data" }, { status: 500 })
  }
}
