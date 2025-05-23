import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import Ticket from "@/models/Ticket"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { generateSlug } from "@/lib/utils"
import { logWithTimestamp } from "@/utils/logger"

// Define validation schema for event creation
const questionSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean(),
});

const ticketSchema = z.object({
  name: z.string().min(1, { message: "Ticket name is required" }),
  description: z.string().optional(),
  price: z.number().min(0, { message: "Price must be a positive number" }),
  quantity: z.number().min(1, { message: "Quantity must be at least 1" }),
  ticketType: z.enum(["Free", "Paid", "Donation"]),
  ticketNumber: z.string().optional(),
  userId: z.string().optional(),
});

const detailsSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  displayName: z.string().min(1, { message: "Display name is required" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  date: z.string().or(z.date()),
  startTime: z.string().min(1, { message: "Start time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  endDate: z.string().or(z.date()).optional(),
  location: z.string().min(3, { message: "Location must be at least 3 characters" }),
  category: z.string().min(1, { message: "Category is required" }),
  type: z.enum(["Online", "Offline", "Hybrid"]),
  visibility: z.enum(["Public", "Private"]),
  image: z.string().url({ message: "Please enter a valid URL" }),
  slug: z.string(),
  customQuestions: z.object({
    attendee: z.array(questionSchema),
    volunteer: z.array(questionSchema),
    speaker: z.array(questionSchema),
  }),
  status: z.string(),
  attendeeForm: z.object({ status: z.string() }),
  volunteerForm: z.object({ status: z.string() }),
  speakerForm: z.object({ status: z.string() }),
});

const eventSchema = z.object({
  details: detailsSchema,
  tickets: z.array(ticketSchema),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const requestData = await req.json()

    logWithTimestamp("info", "Request data:", requestData)

    // Validate the request data
    try {
      eventSchema.parse(requestData)
    } catch (validationError: any) {
      logWithTimestamp("error", "Validation error:", validationError)
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationError.errors?.map((err: any) => err.message) || ["Invalid data"],
        },
        { status: 400 },
      )
    }

    // Generate a slug from the title
    // const slug = generateSlug(requestData.details.title)

    // Check for duplicate slug
    const existingEvent = await Event.findOne({ slug: requestData.details.slug });
    if (existingEvent) {
      logWithTimestamp("error", "Duplicate slug error:", existingEvent)
      return NextResponse.json(
        { error: "An event with this slug already exists. Please choose a different name." },
        { status: 409 }
      );
    }

    const organizerId =
      session && session?.user && session?.user.id
        ? session.user.id
        : requestData.tickets.userId;

    // Create the event
    const event = new Event({
      ...requestData.details,
      tags: [],
      organizer: organizerId,
    })

    logWithTimestamp("info", "Event data before saving Event:", event)

    await event.save()

    // Create tickets for the event
    const tickets = []
    for (const ticketData of requestData.tickets) {
      // Generate a ticket number if not provided
      const ticketNumber =
        ticketData.ticketNumber ||
        `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().substring(9)}`

      const ticket = new Ticket({
        event: event._id,
        name: ticketData.name,
        description: ticketData.description || "",
        price: ticketData.price,
        quantity: ticketData.quantity,
        ticketType: ticketData.ticketType,
        ticketNumber: ticketNumber,
        userId: organizerId,
      })

      await ticket.save()
      // await event.save()

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
