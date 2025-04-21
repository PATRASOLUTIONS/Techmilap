import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Calendar, Users, Clock } from "lucide-react"
import Link from "next/link"

export default async function EventTemplatesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Only event planners and super admins can access this page
  if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
    redirect("/dashboard")
  }

  // Mock data for demonstration
  const templates = [
    {
      id: "1",
      name: "Conference Template",
      description: "A template for large conferences with multiple sessions and tracks.",
      category: "Conference",
      ticketTypes: ["Early Bird", "Regular", "VIP"],
      lastUsed: "2023-01-15",
    },
    {
      id: "2",
      name: "Workshop Template",
      description: "A template for interactive workshops with limited capacity.",
      category: "Workshop",
      ticketTypes: ["Standard", "Student"],
      lastUsed: "2023-02-20",
    },
    {
      id: "3",
      name: "Webinar Template",
      description: "A template for online webinars with Q&A sessions.",
      category: "Webinar",
      ticketTypes: ["Free", "Premium"],
      lastUsed: "2023-03-10",
    },
    {
      id: "4",
      name: "Networking Event",
      description: "A template for networking events with registration and check-in.",
      category: "Networking",
      ticketTypes: ["Standard"],
      lastUsed: "2023-04-05",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Event Templates</h1>
        <p className="text-muted-foreground">Create and manage templates for quick event creation.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search templates..." className="pl-8" />
        </div>
        <Button asChild>
          <Link href="/dashboard/events/templates/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-primary to-secondary" />
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Category: {template.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Ticket Types: {template.ticketTypes.join(", ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Last Used: {template.lastUsed}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button size="sm" asChild>
                <Link href={`/dashboard/events/create?template=${template.id}`}>Use Template</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
