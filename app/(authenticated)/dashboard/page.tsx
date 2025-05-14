import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { EventStats } from "@/components/dashboard/event-stats"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { CalendarPlus, ChevronRight, LineChart, Search, Settings, Users, Star, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import mongoose from "mongoose"

async function getUserEvents(userId: string) {
  try {
    await connectToDatabase()

    // Convert string ID to MongoDB ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId)

    console.log(`Fetching events for user: ${userId}`)

    // Find all events where the current user is the organizer
    const events = await Event.find({ organizer: userObjectId }).sort({ createdAt: -1 }).lean().exec()

    console.log(`Found ${events.length} events for user ${userId}`)
    return events
  } catch (error) {
    console.error("Error fetching user events:", error)
    // Return empty array on error instead of failing
    return []
  }
}

async function getEventStats(userId: string) {
  try {
    await connectToDatabase()

    const userObjectId = new mongoose.Types.ObjectId(userId)

    // Get total events count
    const totalEvents = await Event.countDocuments({ organizer: userObjectId })

    // Get active events count (events with status "published" and date in the future)
    const activeEvents = await Event.countDocuments({
      organizer: userObjectId,
      status: "published",
      date: { $gte: new Date() },
    })

    // Get total attendees count (sum of all attendees arrays length)
    const eventsWithAttendees = await Event.find({ organizer: userObjectId }, { attendees: 1 })
    const totalAttendees = eventsWithAttendees.reduce((sum, event) => {
      return sum + (Array.isArray(event.attendees) ? event.attendees.length : 0)
    }, 0)

    // Get tickets sold count from registrations collection
    const db = mongoose.connection.db
    const registrations = await db.collection("formSubmissions").countDocuments({
      eventOrganizer: userObjectId,
      formType: "attendee",
    })

    return {
      totalEvents,
      activeEvents,
      totalAttendees,
      ticketsSold: registrations,
    }
  } catch (error) {
    console.error("Error calculating event stats:", error)
    return {
      totalEvents: 0,
      activeEvents: 0,
      totalAttendees: 0,
      ticketsSold: 0,
    }
  }
}

export default async function Dashboard() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      redirect("/login")
    }

    console.log(
      "Dashboard accessed with session:",
      JSON.stringify({
        name: session.user.name,
        role: session.user.role,
        id: session.user.id,
      }),
    )

    // Redirect based on user role
    if (session.user.role === "user") {
      console.log("Redirecting user to user-dashboard")
      redirect("/user-dashboard")
    } else if (session.user.role === "super-admin") {
      // Super admins can access this dashboard
      console.log("Super admin accessing dashboard")
    } else if (session.user.role !== "event-planner") {
      // If not event-planner or super-admin, redirect to user dashboard
      console.log("Non-event planner role accessing dashboard, redirecting")
      redirect("/user-dashboard")
    }

    const isSuperAdmin = session.user.role === "super-admin"

    // Default stats in case of errors
    let stats = {
      totalEvents: 0,
      activeEvents: 0,
      totalAttendees: 0,
      ticketsSold: 0,
    }

    let userEvents: any[] = []

    try {
      if (!isSuperAdmin) {
        // For event planners, fetch their actual data
        stats = await getEventStats(session.user.id)
        userEvents = await getUserEvents(session.user.id)
      } else {
        // For super admins, we could fetch platform-wide stats
        // This is placeholder data - in a real app, you'd fetch actual platform stats
        stats = {
          totalEvents: 45,
          activeEvents: 28,
          totalAttendees: 5800,
          ticketsSold: 4200,
        }
      }
    } catch (fetchError) {
      console.error("Error fetching dashboard data:", fetchError)
      // We've already set default stats above, so we can continue rendering
    }

    // Sort events by date
    const sortedEvents = [...userEvents].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    // Get recent events (most recently created)
    const recentEvents = sortedEvents.slice(0, 3)

    // Get upcoming events (events with future dates)
    const upcomingEvents = sortedEvents
      .filter((event) => new Date(event.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3)

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isSuperAdmin ? "Admin Dashboard" : "Event Planner Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.name}!{" "}
            {isSuperAdmin ? "Here's an overview of all events." : "Here's an overview of your events."}
          </p>
        </div>

        <EventStats
          totalEvents={stats.totalEvents}
          activeEvents={stats.activeEvents}
          totalAttendees={stats.totalAttendees}
          ticketsSold={stats.ticketsSold}
        />

        {isSuperAdmin ? (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Platform Overview</TabsTrigger>
              <TabsTrigger value="actions">Admin Actions</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Platform Statistics</CardTitle>
                    <CardDescription>Overall platform performance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Total Users</p>
                        <p className="text-2xl font-bold">1,245</p>
                      </div>
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Event Planners</p>
                        <p className="text-2xl font-bold">87</p>
                      </div>
                      <Star className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Average Rating</p>
                        <p className="text-2xl font-bold">4.8/5</p>
                      </div>
                      <Star className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Recent Events</CardTitle>
                    <CardDescription>Recently created events</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Tech Summit {2023 + i}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(2023, i + 5, 10).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/events/${i}`}>View</Link>
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>Current system performance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Server Status</p>
                        <p className="text-sm text-green-500">Operational</p>
                      </div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Database Status</p>
                        <p className="text-sm text-green-500">Operational</p>
                      </div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">API Status</p>
                        <p className="text-sm text-green-500">Operational</p>
                      </div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Last Backup</p>
                        <p className="text-sm text-muted-foreground">Today, 04:30 AM</p>
                      </div>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="actions">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Actions</CardTitle>
                  <CardDescription>Manage the platform and users</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button asChild variant="outline" className="justify-between">
                    <Link href="/super-admin/users">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Manage Users</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-between">
                    <Link href="/super-admin/events">
                      <div className="flex items-center gap-2">
                        <CalendarPlus className="h-4 w-4" />
                        <span>Manage All Events</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-between">
                    <Link href="/super-admin/events/categories">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span>Manage Categories</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-between">
                    <Link href="/super-admin/settings">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span>Platform Settings</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks you can perform</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button asChild variant="outline" className="justify-between">
                  <Link href="/dashboard/events/create">
                    <div className="flex items-center gap-2">
                      <CalendarPlus className="h-4 w-4" />
                      <span>Create New Event</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-between">
                  <Link href="/my-events">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>Manage Events</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-between">
                  <Link href="/explore">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      <span>Explore Events</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-between">
                  <Link href="/dashboard/analytics">
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4" />
                      <span>View Analytics</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Recent Events</CardTitle>
                <CardDescription>Your most recent events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentEvents.length > 0 ? (
                  recentEvents.map((event) => (
                    <div key={event._id.toString()} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/event-dashboard/${event._id}`}>View</Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No recent events found</p>
                    <Button variant="link" asChild className="mt-2">
                      <Link href="/dashboard/events/create">Create your first event</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Events scheduled in the near future</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <div key={event._id.toString()} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/event-dashboard/${event._id}`}>View</Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No upcoming events found</p>
                    <Button variant="link" asChild className="mt-2">
                      <Link href="/dashboard/events/create">Schedule an event</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error("Unhandled error in Dashboard component:", error)
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="mb-4">We encountered an error loading your dashboard.</p>
        <p className="text-sm text-gray-500">
          Please try refreshing the page or contact support if the issue persists.
        </p>
      </div>
    )
  }
}
