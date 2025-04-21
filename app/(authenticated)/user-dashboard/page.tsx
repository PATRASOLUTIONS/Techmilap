import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, ChevronRight, Users, Ticket } from "lucide-react"

export default async function UserDashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // If user is an event planner or super admin, redirect to appropriate dashboard
  if (session.user.role === "event-planner") {
    redirect("/dashboard")
  } else if (session.user.role === "super-admin") {
    redirect("/super-admin")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session.user.name}! Here's your event overview.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Things you can do</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild variant="outline" className="justify-between">
              <Link href="/explore">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Explore Events</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link href="/my-events">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  <span>My Tickets</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link href="/profile">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Update Profile</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events you're registered for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* This would be populated from the database in a real implementation */}
            <div className="text-center py-6 text-muted-foreground">
              <p>You haven't registered for any upcoming events yet.</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/explore">Explore Events</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Your Activity</CardTitle>
            <CardDescription>Recent actions and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-muted-foreground">
              <p>No recent activity to show.</p>
              <p className="text-sm mt-1">Your activity will appear here as you use the platform.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
