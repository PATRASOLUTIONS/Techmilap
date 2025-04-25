import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { RegistrationsTable } from "@/components/dashboard/registrations-table"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"

export default async function EventAttendeesPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Only event planners and super admins can access this page
  if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
    redirect("/dashboard")
  }

  const eventId = params.id

  // Connect to the database to fetch event details
  await connectToDatabase()

  // Define Event model if it doesn't exist
  const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)

  // Fetch event details
  let event = null

  try {
    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(eventId)

    if (isValidObjectId) {
      // If it's a valid ObjectId, try to find by ID first
      event = await Event.findById(eventId).lean()
    }

    // If not found by ID or not a valid ObjectId, try to find by slug
    if (!event) {
      event = await Event.findOne({ slug: eventId }).lean()
    }

    // If still not found, we'll let the component handle the error
  } catch (error) {
    console.error("Error fetching event details:", error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Event Attendees</h1>
        <p className="text-muted-foreground">
          {event ? `Manage attendees for ${event.name}` : "Manage attendees for your event."}
        </p>
      </div>

      <RegistrationsTable
        eventId={eventId}
        title="Event Attendees"
        description="View, filter, and manage registrations for this event. Approve or reject attendees and send them notifications."
      />
    </div>
  )
}
