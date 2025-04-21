import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { EventCreationForm } from "@/components/events/event-creation-form"

export default async function CreateEventPage() {
  const session = await getServerSession(authOptions)

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
          Fill out the form below to create a new event. You can save it as a draft or publish it right away.
        </p>
      </div>

      <EventCreationForm />
    </div>
  )
}
