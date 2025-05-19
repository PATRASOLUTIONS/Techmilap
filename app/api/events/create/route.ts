import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import Ticket from "@/models/Ticket"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { z } from "zod"
import User from "@/models/User"

// Define validation schema for event details
const EventDetailsSchema = z.object({
  name: z.string().min(1, "Event name is required").max(200, "Event name cannot exceed 200 characters"),
  displayName: z.string().max(200, "Display name cannot exceed 200 characters").optional(),
  description: z.string().min(1, "Event description is required"),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date",
  }),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "End date must be a valid date",
    })
    .optional(),
  startTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Start time must be in HH:MM format")
    .optional(),
  endTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "End time must be in HH:MM format")
    .optional(),
  type: z.enum(["Online", "Offline", "Hybrid"]),
  visibility: z.enum(["Public", "Private"]).default("Public"),
  venue: z.string().optional(),
  address: z.string().optional(),
  coverImageUrl: z.string().url("Cover image URL must be a valid URL").optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase alphanumeric characters and hyphens")
    .optional(),
})

// Define validation schema for ticket
const TicketSchema = z.object({
  name: z.string().min(1, "Ticket name is required"),
  type: z.string().optional(),
  description: z.string().optional(),
  pricingModel: z.enum(["Free", "Paid", "Donation"]).default("Free"),
  price: z.number().min(0, "Price cannot be negative").optional(),
  quantity: z.number().min(1, "Quantity must be at least 1").optional(),
  saleStartDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Sale start date must be a valid date",
    })
    .optional(),
  saleEndDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Sale end date must be a valid date",
    })
    .optional(),
  feeStructure: z.string().optional(),
  ticketNumber: z.string().optional(), // Make ticketNumber optional
  userId: z.string().optional(), // Make userId optional
})

// Define validation schema for event creation request
const EventCreationSchema = z.object({
  details: EventDetailsSchema,
  tickets: z.array(TicketSchema).optional(),
  customQuestions: z
    .object({
      attendee: z.array(z.any()).optional(),
      volunteer: z.array(z.any()).optional(),
      speaker: z.array(z.any()).optional(),
    })
    .optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  attendeeForm: z
    .object({
      status: z.enum(["draft", "published"]).default("draft"),
    })
    .optional(),
  volunteerForm: z
    .object({
      status: z.enum(["draft", "published"]).default("draft"),
    })
    .optional(),
  speakerForm: z
    .object({
      status: z.enum(["draft", "published"]).default("draft"),
    })
    .optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only event planners and super admins can create events
    if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 })
    }

    // Connect to database with error handling
    try {
      await connectToDatabase()
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: "Unable to connect to the database. Please try again later.",
        },
        { status: 503 },
      )
    }

    // Parse and validate request data
    let requestData
    try {
      const rawData = await req.json()
      // Validate against schema
      const validationResult = EventCreationSchema.safeParse(rawData)

      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Validation error",
            details: validationResult.error.format(),
          },
          { status: 400 },
        )
      }

      requestData = validationResult.data
    } catch (error) {
      console.error("Error parsing request JSON:", error)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    // Extract validated data
    const {
      details,
      tickets = [],
      customQuestions = { attendee: [], volunteer: [], speaker: [] },
      status = "draft",
      attendeeForm = { status: "draft" },
      volunteerForm = { status: "draft" },
      speakerForm = { status: "draft" },
    } = requestData

    // Determine if the event should be public based on visibility setting
    const eventStatus = status === "published" || details.visibility === "Public" ? "published" : "draft"

    // Generate a slug if one doesn't exist
    let slug = details.slug || generateSlug(details.name)

    // Check if slug is already in use
    const existingEventWithSlug = await Event.findOne({ slug })
    if (existingEventWithSlug) {
      // Append a random string to make the slug unique
      const randomString = Math.random().toString(36).substring(2, 8)
      slug = `${slug}-${randomString}`
    }

    // Prepare event data
    const eventData = {
      title: details.name,
      displayName: details.displayName || details.name,
      description: details.description || "",
      date: new Date(details.startDate),
      endDate: details.endDate ? new Date(details.endDate) : new Date(details.startDate),
      startTime: details.startTime || "00:00",
      endTime: details.endTime || "23:59",
      location: details.type === "Online" ? "Online" : details.venue || "TBD",
      venue: details.venue || "",
      address: details.address || "",
      type: details.type || "Offline",
      visibility: details.visibility || "Public",
      capacity: Array.isArray(tickets)
        ? tickets.reduce((total, ticket) => {
            const quantity = Number(ticket.quantity || 0)
            return isNaN(quantity) ? total : total + quantity
          }, 0)
        : 0,
      price:
        Array.isArray(tickets) && tickets.some((t) => t?.pricingModel === "Paid")
          ? Math.min(
              ...tickets
                .filter((t) => t?.pricingModel === "Paid")
                .map((t) => {
                  const price = Number(t.price || 0)
                  return isNaN(price) ? 0 : price
                }),
            )
          : 0,
      category: "Tech", // Default category
      status: eventStatus,
      slug: slug,
      image: details.coverImageUrl || "",
      attendeeForm: {
        status: attendeeForm?.status || "draft",
      },
      volunteerForm: {
        status: volunteerForm?.status || "draft",
      },
      speakerForm: {
        status: speakerForm?.status || "draft",
      },
      customQuestions: {
        attendee: Array.isArray(customQuestions.attendee) ? customQuestions.attendee : [],
        volunteer: Array.isArray(customQuestions.volunteer) ? customQuestions.volunteer : [],
        speaker: Array.isArray(customQuestions.speaker) ? customQuestions.speaker : [],
      },
    }

    // Create the new event with the organizer ID
    const newEvent = {
      ...eventData,
      organizer: new ObjectId(session.user.id),
    }

    console.log("Creating new event with form status:", {
      attendeeForm: newEvent.attendeeForm,
      volunteerForm: newEvent.volunteerForm,
      speakerForm: newEvent.speakerForm,
    })

    // Create and save the event
    const event = new Event(newEvent)
    await event.save()

    // Create tickets if they exist
    if (Array.isArray(tickets) && tickets.length > 0) {
      const ticketPromises = tickets.map((ticket, index) => {
        // Ensure numeric values are properly parsed
        const price = Number(ticket.price || 0)
        const quantity = Number(ticket.quantity || 0)

        // Generate a unique ticket number if not provided
        const ticketNumber = ticket.ticketNumber || `TICKET-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`

        return new Ticket({
          name: ticket.name || "General Admission",
          type: ticket.type || "Standard",
          description: ticket.description || "",
          pricingModel: ticket.pricingModel || "Free",
          price: isNaN(price) ? 0 : price,
          quantity: isNaN(quantity) ? 0 : quantity,
          saleStartDate: ticket.saleStartDate || event.date,
          saleEndDate: ticket.saleEndDate || event.date,
          feeStructure: ticket.feeStructure || "Organizer",
          event: event._id,
          createdBy: session.user.id,
          ticketNumber: ticketNumber, // Add auto-generated ticket number
          userId: ticket.userId || session.user.id, // Use session user ID if not provided
        }).save()
      })

      await Promise.all(ticketPromises)
    }

    // Update user's createdEvents array
    await User.findByIdAndUpdate(session.user.id, { $addToSet: { createdEvents: event._id } })

    return NextResponse.json(
      {
        success: true,
        event: {
          id: event._id,
          title: event.title,
          slug: event.slug,
          formStatus: {
            attendee: event.attendeeForm?.status || "draft",
            volunteer: event.volunteerForm?.status || "draft",
            speaker: event.speakerForm?.status || "draft",
          },
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error creating event:", error)

    // Provide appropriate error response based on error type
    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          error: "Validation error",
          details: Object.values(error.errors).map((err: any) => err.message),
        },
        { status: 400 },
      )
    }

    if (error.code === 11000) {
      return NextResponse.json(
        {
          error: "Duplicate key error",
          details: "An event with this slug already exists. Please use a different slug.",
        },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        error: "An error occurred while creating the event",
        message: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Helper function to generate a slug from text with improved sanitization
function generateSlug(text: string): string {
  if (!text) return "event-" + Date.now()

  return (
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
      .trim() || "event-" + Date.now()
  ) // Fallback if slug is empty
}
