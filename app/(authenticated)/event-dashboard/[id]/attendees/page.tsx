import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { RegistrationsTable } from "@/components/dashboard/registrations-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Filter } from "lucide-react"

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
              <CardTitle>Attendee Filtering</CardTitle>
              <CardDescription>
                Use the filter button to find specific attendees based on their registration information.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p>
            You can filter attendees by status (pending, approved, rejected) or by any custom field from your
            registration form. Click the &quot;Filter Attendees&quot; button to get started.
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Filter by registration status</li>
            <li>Filter by custom form fields</li>
            <li>Combine multiple filters</li>
            <li>Export filtered results to CSV</li>
          </ul>
        </CardContent>
      </Card>

      <RegistrationsTable
        eventId={eventId}
        title="Event Attendees"
        description="Manage your event attendees. Use filters to find specific attendees based on their registration information."
      />
    </div>
  )
}
