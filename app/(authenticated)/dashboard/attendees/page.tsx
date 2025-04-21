import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Download, Filter } from "lucide-react"

export default async function AttendeesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Only event planners and super admins can access this page
  if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
    redirect("/dashboard")
  }

  // Mock data for demonstration
  const attendees = [
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
      event: "Tech Conference 2023",
      ticketType: "VIP",
      registrationDate: "2023-01-15",
      status: "Confirmed",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      event: "Tech Conference 2023",
      ticketType: "General Admission",
      registrationDate: "2023-01-16",
      status: "Confirmed",
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob.johnson@example.com",
      event: "Developer Workshop",
      ticketType: "Early Bird",
      registrationDate: "2023-01-17",
      status: "Pending",
    },
    {
      id: "4",
      name: "Alice Brown",
      email: "alice.brown@example.com",
      event: "AI Summit",
      ticketType: "Student",
      registrationDate: "2023-01-18",
      status: "Confirmed",
    },
    {
      id: "5",
      name: "Charlie Wilson",
      email: "charlie.wilson@example.com",
      event: "Tech Conference 2023",
      ticketType: "General Admission",
      registrationDate: "2023-01-19",
      status: "Cancelled",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendees</h1>
        <p className="text-muted-foreground">Manage and view all attendees for your events.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search attendees..." className="pl-8" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" className="w-full md:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export Attendees
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Attendees</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>All Attendees</CardTitle>
              <CardDescription>Showing all attendees across all events.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Event</th>
                      <th className="text-left py-3 px-4 font-medium">Ticket Type</th>
                      <th className="text-left py-3 px-4 font-medium">Registration Date</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((attendee) => (
                      <tr key={attendee.id} className="border-b">
                        <td className="py-3 px-4">{attendee.name}</td>
                        <td className="py-3 px-4">{attendee.email}</td>
                        <td className="py-3 px-4">{attendee.event}</td>
                        <td className="py-3 px-4">{attendee.ticketType}</td>
                        <td className="py-3 px-4">{attendee.registrationDate}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              attendee.status === "Confirmed"
                                ? "bg-green-100 text-green-800"
                                : attendee.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {attendee.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Confirmed Attendees</CardTitle>
              <CardDescription>Showing attendees with confirmed status.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Event</th>
                      <th className="text-left py-3 px-4 font-medium">Ticket Type</th>
                      <th className="text-left py-3 px-4 font-medium">Registration Date</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees
                      .filter((attendee) => attendee.status === "Confirmed")
                      .map((attendee) => (
                        <tr key={attendee.id} className="border-b">
                          <td className="py-3 px-4">{attendee.name}</td>
                          <td className="py-3 px-4">{attendee.email}</td>
                          <td className="py-3 px-4">{attendee.event}</td>
                          <td className="py-3 px-4">{attendee.ticketType}</td>
                          <td className="py-3 px-4">{attendee.registrationDate}</td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Pending Attendees</CardTitle>
              <CardDescription>Showing attendees with pending status.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Event</th>
                      <th className="text-left py-3 px-4 font-medium">Ticket Type</th>
                      <th className="text-left py-3 px-4 font-medium">Registration Date</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees
                      .filter((attendee) => attendee.status === "Pending")
                      .map((attendee) => (
                        <tr key={attendee.id} className="border-b">
                          <td className="py-3 px-4">{attendee.name}</td>
                          <td className="py-3 px-4">{attendee.email}</td>
                          <td className="py-3 px-4">{attendee.event}</td>
                          <td className="py-3 px-4">{attendee.ticketType}</td>
                          <td className="py-3 px-4">{attendee.registrationDate}</td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Cancelled Attendees</CardTitle>
              <CardDescription>Showing attendees with cancelled status.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Event</th>
                      <th className="text-left py-3 px-4 font-medium">Ticket Type</th>
                      <th className="text-left py-3 px-4 font-medium">Registration Date</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees
                      .filter((attendee) => attendee.status === "Cancelled")
                      .map((attendee) => (
                        <tr key={attendee.id} className="border-b">
                          <td className="py-3 px-4">{attendee.name}</td>
                          <td className="py-3 px-4">{attendee.email}</td>
                          <td className="py-3 px-4">{attendee.event}</td>
                          <td className="py-3 px-4">{attendee.ticketType}</td>
                          <td className="py-3 px-4">{attendee.registrationDate}</td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
