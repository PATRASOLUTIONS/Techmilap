import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    await connectToDatabase()

    // Import models
    const Ticket = (await import("@/models/Ticket")).default
    const Event = (await import("@/models/Event")).default
    const FormSubmission = (await import("@/models/FormSubmission")).default

    const userId = session.user.id

    // Find or create a test event
    let event = await Event.findOne({ title: "Test Event" })

    if (!event) {
      event = new Event({
        title: "Test Event",
        description: "This is a test event for ticket testing",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        startTime: "10:00",
        endTime: "18:00",
        location: "Test Location",
        organizer: userId,
        status: "published",
        capacity: 100,
        slug: "test-event",
      })
      await event.save()
    }

    // Create a test ticket
    const ticket = new Ticket({
      name: "Test Ticket",
      type: "General Admission",
      description: "Test ticket for testing",
      pricingModel: "Free",
      price: 0,
      quantity: 10,
      saleStartDate: new Date(),
      saleEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      event: event._id,
      createdBy: userId,
      userId: userId,
      ticketNumber:
        "TEST" +
        Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0"),
      status: "confirmed",
      purchasedAt: new Date(),
    })
    await ticket.save()

    // Create a test form submission
    const formSubmission = new FormSubmission({
      eventId: event._id,
      userId: userId,
      formType: "attendee",
      status: "approved",
      data: {
        name: "Test Attendee",
        email: "test@example.com",
        question_mobile: "+1234567890",
        comments: "This is a test submission",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await formSubmission.save()

    return NextResponse.json({
      success: true,
      message: "Test tickets created successfully",
      ticket: ticket,
      formSubmission: formSubmission,
      event: event,
    })
  } catch (error: any) {
    console.error("Error creating test tickets:", error)
    return NextResponse.json({ error: `Failed to create test tickets: ${error.message}` }, { status: 500 })
  }
}
