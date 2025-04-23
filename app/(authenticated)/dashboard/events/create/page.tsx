import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { EventCreationForm } from "@/components/events/event-creation-form"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"

interface Props {
  searchParams: {
    edit?: string
  }
}

export default async function CreateEventPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Only event planners and super admins can create events
  if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
    redirect("/user-dashboard")
  }

  const { edit: eventId } = searchParams

  let existingEvent = null
  if (eventId) {
    await connectToDatabase()
    existingEvent = await Event.findById(eventId).lean()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{eventId ? "Edit Event" : "Create New Event"}</h1>
        <p className="text-muted-foreground">
          Fill out the form below to {eventId ? "edit" : "create"} an event. Events can be scheduled up to 1 year in
          advance, with operating hours between 9:00 and 21:00.
        </p>
      </div>

      <EventCreationForm existingEvent={existingEvent} isEditing={!!eventId} />
    </div>
  )
}
