import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SubmissionsTable } from "@/components/dashboard/submissions-table"

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Event Attendees</h1>
      <SubmissionsTable
        eventId={eventId}
        title="Event Attendees"
        formType="attendee"
        description="Manage your event attendees."
      />
    </div>
  )
}
