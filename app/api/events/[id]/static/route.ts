import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    // Import models dynamically
    const Event = mongoose.models.Event || mongoose.model("Event", new mongoose.Schema({}))
    const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}))

    let event = null

    // Try to find by ID
    if (mongoose.isValidObjectId(params.id)) {
      event = await Event.findById(params.id).lean()
    }

    // Try to find by slug
    if (!event) {
      event = await Event.findOne({ slug: params.id }).lean()
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Fetch organizer info
    let organizerName = "Event Organizer"
    if (event.organizer && mongoose.isValidObjectId(event.organizer)) {
      try {
        const organizer = await User.findById(event.organizer).lean()
        if (organizer) {
          if (organizer.firstName || organizer.lastName) {
            organizerName = `${organizer.firstName || ""} ${organizer.lastName || ""}`.trim()
          } else if (organizer.name) {
            organizerName = organizer.name
          } else if (organizer.email) {
            organizerName = organizer.email.split("@")[0]
          }
        }
      } catch (error) {
        console.error("Error fetching organizer:", error)
      }
    }

    // Prepare the response
    const eventData = {
      id: event._id.toString(),
      title: event.title || "Untitled Event",
      description: event.description || "",
      date: event.date || null,
      endDate: event.endDate || null,
      startTime: event.startTime || null,
      endTime: event.endTime || null,
      location: event.location || "Location TBA",
      image: event.image || "/vibrant-tech-event.png",
      category: event.category || null,
      price: event.price || 0,
      tags: Array.isArray(event.tags) ? event.tags : [],
      slug: event.slug || event._id.toString(),
      organizerName,
    }

    return NextResponse.json(eventData)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}
