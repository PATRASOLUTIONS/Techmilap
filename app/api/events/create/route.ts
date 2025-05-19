import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import Ticket from "@/models/Ticket"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { generateSlug } from "@/lib/utils"

// Define validation schema for event creation
const eventSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  date: z.string().or(z.date()),
  startTime: z.string().min(1, { message: "Start time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  location: z.string().min(3, { message: "Location must be at least 3 characters" }),
  category: z.string().min(1, { message: "Category is required" }),
  image: z.string().url({ message: "Please enter a valid URL" }),
  visibility: z.enum(["Public", "Private"]),
  type: z.enum(["Online", "Offline", "Hybrid"]),
  tickets: z.array(
    z.object({
      name: z.string().min(1, { message: "Ticket name is required" }),
      description: z.string().optional(),
      price: z.number().min(0, { message: "Price must be a positive number" }),
      quantity: z.number().min(1, { message: "Quantity must be at least 1" }),
      ticketType: z.enum(["Free", "Paid", "Donation"]),
      // Make ticketNumber and userId optional as they'll be auto-generated
      ticketNumber: z.string().optional(),
      userId: z.string().optional(),
    }),
  ),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const requestData = await req.json()

    // Validate the request data
    try {
      eventSchema.parse(requestData)
    } catch (validationError: any) {
      console.error("Validation error:", validationError)
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationError.errors?.map((err: any) => err.message) || ["Invalid data"],
        },
        { status: 400 },
      )
    }

    // Generate a slug from the title
    const slug = generateSlug(requestData.title)

    // Create the event
    const event = new Event({
      title: requestData.title,
      description: requestData.description,
      date: requestData.date,
      startTime: requestData.startTime,
      endTime: requestData.endTime,
      location: requestData.location,
      category: requestData.category,
      image: requestData.image,
      visibility: requestData.visibility,
      type: requestData.type,
      organizer: session.user.id,
      slug: slug,
      status: requestData.visibility === "Public" ? "published" : "draft",
    })

    await event.save()

    // Create tickets for the event
    const tickets = []
    for (const ticketData of requestData.tickets) {
      // Generate a ticket number if not provided
      const ticketNumber =
        ticketData.ticketNumber ||
        `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().substring(9)}`

      // Use the session user ID if not provided
      const userId = ticketData.userId || session.user.id

      const ticket = new Ticket({
        event: event._id,
        name: ticketData.name,
        description: ticketData.description || "",
        price: ticketData.price,
        quantity: ticketData.quantity,
        ticketType: ticketData.ticketType,
        ticketNumber: ticketNumber,
        userId: userId,
      })

      await ticket.save()
      tickets.push(ticket)
    }

    return NextResponse.json({
      success: true,
      event: {
        ...event.toObject(),
        tickets,
      },
    })
  } catch (error: any) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: error.message || "An error occurred while creating the event" }, { status: 500 })
  }
}
