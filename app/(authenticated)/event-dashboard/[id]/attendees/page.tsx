import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Filter } from "lucide-react"
import { Suspense } from "react"
import { RegistrationsTableWrapper } from "@/components/dashboard/registrations-table-wrapper"

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Event Attendees</h1>
        <p className="text-muted-foreground">Manage attendees for your event.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            <div>
              <CardTitle>Attendee Management</CardTitle>
              <CardDescription>
                View and manage attendees for your event. You can approve, reject, or contact attendees directly.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p>
            Use the filters and search to find specific attendees. Click on column headers to sort the data. Select
            multiple attendees to perform bulk actions.
          </p>
        </CardContent>
      </Card>

      <Suspense fallback={<div className="text-center py-10">Loading attendee data...</div>}>
        <RegistrationsTableWrapper eventId={eventId} />
      </Suspense>
    </div>
  )
}
