import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { RegistrationsTable } from "@/components/dashboard/registrations-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Filter, CheckCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              <div>
                <CardTitle>Bulk Actions</CardTitle>
                <CardDescription>Select multiple attendees to approve or export their information.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="h-4 w-4 mr-2" />
              Bulk Approve
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Attendees
            </Button>
          </CardContent>
        </Card>
      </div>

      <RegistrationsTable
        eventId={eventId}
        title="Event Attendees"
        description="Manage your event attendees. Use filters to find specific attendees based on their registration information."
      />
    </div>
  )
}
