import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import Ticket from "@/models/Ticket"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only event planners and super admins can create events
    if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 })
    }

    await connectToDatabase()

    let requestData
    try {
      requestData = await req.json()
    } catch (error) {
      console.error("Error parsing request JSON:", error)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    // Validate that required data exists
    if (!requestData) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 })
    }

    // Update the event creation logic to properly handle form status
    const {
      details,
      tickets = [],
      customQuestions = { attendee: [], volunteer: [], speaker: [] },
      status = "draft",
      attendeeForm = { status: "draft" },
      volunteerForm = { status: "draft" },
      speakerForm = { status: "draft" },
    } = requestData

    // Validate that details exist
    if (!details) {
      return NextResponse.json({ error: "Event details are required" }, { status: 400 })
    }

    // Validate required fields
    if (!details.name) {
      return NextResponse.json({ error: "Event name is required" }, { status: 400 })
    }

    // Determine if the event should be public based on visibility setting
    const eventStatus = status === "published" || details.visibility === "Public" ? "published" : "draft"

    // Generate a slug if one doesn't exist
    const slug = details.slug || generateSlug(details.name)

    // Update the eventData object to include form status
    const eventData = {
      title: details.name,
      displayName: details.displayName || details.name, // Fallback to name if displayName is missing
      description: details.description || "",
      date: details.startDate || new Date(),
      endDate: details.endDate || details.startDate || new Date(),
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
      status: eventStatus, // Use the determined status based on visibility and explicit status
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

    const event = new Event(newEvent)

    await event.save()

    // Create tickets if they exist
    if (Array.isArray(tickets) && tickets.length > 0) {
      const ticketPromises = tickets.map((ticket) => {
        // Ensure numeric values are properly parsed
        const price = Number(ticket.price || 0)
        const quantity = Number(ticket.quantity || 0)

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
        }).save()
      })

      await Promise.all(ticketPromises)
    }

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
    return NextResponse.json({ error: error.message || "An error occurred while creating the event" }, { status: 500 })
  }
}

// Helper function to generate a slug from text
function generateSlug(text: string): string {
  if (!text) return "event-" + Date.now()

  return (
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .trim() || "event-" + Date.now()
  ) // Fallback if slug is empty
}
