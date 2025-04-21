import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SubmissionsTable } from "@/components/dashboard/submissions-table"

export default async function EventSpeakersPage({ params }: { params: { id: string } }) {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Speaker Applications</h1>
        <p className="text-muted-foreground">Manage speaker applications for your event.</p>
      </div>

      <SubmissionsTable
        eventId={eventId}
        formType="speaker"
        title="Speaker Applications"
        description="Review and manage speaker applications for your event."
      />
    </div>
  )
}
