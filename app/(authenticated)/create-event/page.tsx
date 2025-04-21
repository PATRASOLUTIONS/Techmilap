import { EventCreationForm } from "@/components/events/event-creation-form"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CreateEventPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login?callbackUrl=/create-event")
  }

  // Only event planners and super admins can create events
  if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
    redirect("/dashboard")
  }

  return (
    <div className="container py-10">
      <EventCreationForm />
    </div>
  )
}
