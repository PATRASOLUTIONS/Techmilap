import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { EventCreationForm } from "@/components/events/event-creation-form"

export default async function CreateEventPage() {
  const session = await getServerSession(authOptions)
  console.log("CreateEventPage - authOptions:", authOptions)
  console.log("CreateEventPage - session:", session)

  if (!session) {
    redirect("/login")
  }

  // Only event planners and super admins can create events
  if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
    redirect("/user-dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Event</h1>
        <p className="text-muted-foreground">
          Fill out the form below to create a new event. Events can be scheduled up to 1 year in advance, with operating
          hours between 9:00 and 21:00.
        </p>
      </div>

      <EventCreationForm />
    </div>
  )
}
