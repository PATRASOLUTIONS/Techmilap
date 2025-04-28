import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { RegistrationsTable } from "@/components/dashboard/registrations-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sliders } from "lucide-react"

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
            <Sliders className="h-5 w-5 mr-2" />
            <div>
              <CardTitle>Advanced Filtering</CardTitle>
              <CardDescription>
                Filter attendees based on their registration responses and other criteria.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p>
            The advanced filtering system allows you to find specific attendees based on any information collected
            during registration. Filter options are dynamically generated from your event's custom questions.
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Filter by registration status (pending, approved, rejected)</li>
            <li>Filter by registration date range</li>
            <li>Filter by any custom form field</li>
            <li>Combine multiple filters for precise results</li>
            <li>Export filtered results to CSV</li>
          </ul>
        </CardContent>
      </Card>

      <RegistrationsTable
        eventId={eventId}
        title="Event Attendees"
        description="Manage your event attendees. Use advanced filters to find specific attendees based on their registration information."
      />
    </div>
  )
}
