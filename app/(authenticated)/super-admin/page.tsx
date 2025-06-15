import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, CalendarDays, Star, Settings } from "lucide-react"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import Event from "@/models/Event"
import Review from "@/models/Review"

export default async function SuperAdminDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Ensure the user has the correct role
  if (session.user.role !== "super-admin") {
    if (session.user.role === "event-planner") {
      redirect("/dashboard")
    } else {
      redirect("/user-dashboard")
    }
  }

  // Connect to database
  await connectToDatabase()

  // Fetch statistics
  const [totalUsers, totalEvents, averageRating, recentUsers, recentEvents] = await Promise.all([
    User.countDocuments({}),
    Event.countDocuments({}),
    Review.aggregate([{ $group: { _id: null, avgRating: { $avg: "$rating" } } }]).then(
      (result) => result[0]?.avgRating || 0,
    ),
    User.find({}).sort({ createdAt: -1 }).limit(5).select("name firstName lastName email role createdAt profileImage").lean(),
    Event.find({}).sort({ createdAt: -1 }).limit(5).populate("organizer", "name firstName lastName email profileImage").lean(),
  ])

  console.log("recent events", recentEvents)
  console.log("recentUsers", recentUsers)

  // Calculate new users in the last week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const newUsersLastWeek = await User.countDocuments({ createdAt: { $gte: oneWeekAgo } })

  // Calculate new events in the last week
  const newEventsLastWeek = await Event.countDocuments({ createdAt: { $gte: oneWeekAgo } })

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  // Calculate time ago for display
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "today"
    if (diffDays === 1) return "yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  // Get full name from user data
  const getFullName = (user) => {
    if (user.name) return user.name
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
    if (user.firstName) return user.firstName
    if (user.lastName) return user.lastName
    return user.email ? user.email.split("@")[0] : "Unknown"
  }


  // Determine event status using start/end dates and times
  const getEventStatus = (eventDateStr, eventEndDateStr, startTimeStr, endTimeStr) => {
    if (!eventDateStr) return "Unknown"; // Should not happen if date is required

    const now = new Date();

    const parseTime = (timeStr) => {
      if (!timeStr) return null;
      // Matches HH:MM AM/PM or HH:MM (24h)
      const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
      const match = timeStr.match(timeRegex);

      if (!match) return null;

      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3] ? match[3].toUpperCase() : null;

      if (ampm === "PM" && hours < 12) {
        hours += 12;
      } else if (ampm === "AM" && hours === 12) { // 12 AM is midnight
        hours = 0;
      }
      // For 24h format, hours will be as is.
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null; // Basic validation

      return { hours, minutes };
    };

    const eventStartDate = new Date(eventDateStr);
    const eventStartDateTime = new Date(eventStartDate);
    const parsedStartTime = parseTime(startTimeStr);

    if (parsedStartTime) {
      eventStartDateTime.setHours(parsedStartTime.hours, parsedStartTime.minutes, 0, 0);
    } else {
      eventStartDateTime.setHours(0, 0, 0, 0); // Default to start of the day
    }

    // Use eventStartDate if eventEndDateStr is not provided (for single-day events)
    const eventEndDate = eventEndDateStr ? new Date(eventEndDateStr) : new Date(eventStartDate);
    const eventEndDateTime = new Date(eventEndDate);
    const parsedEndTime = parseTime(endTimeStr);

    if (parsedEndTime) {
      eventEndDateTime.setHours(parsedEndTime.hours, parsedEndTime.minutes, 59, 999); // End of the minute
    } else {
      eventEndDateTime.setHours(23, 59, 59, 999); // Default to end of the day
    }

    if (eventStartDateTime > now) {
      return "Upcoming";
    } else if (eventEndDateTime < now) {
      return "Past";
    } else {
      return "Ongoing"; // Event is currently within its start and end datetime
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {session.user.name}! Here's an overview of the platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{newUsersLastWeek} in the last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{newEventsLastWeek} in the last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Average rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Healthy</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Recent Users</TabsTrigger>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>New users who joined recently.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentUsers.length > 0 ? (
                        recentUsers.map((user, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {getFullName(user)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getTimeAgo(user.createdAt)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                            No recent users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Events created recently.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organizer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentEvents.length > 0 ? (
                        recentEvents.map((event: any, i: number) => (
                          <tr key={i}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {event.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {event.organizer ? getFullName(event.organizer) : "Unknown"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(event.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getEventStatus(event.date, event.endDate, event.startTime, event.endTime)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                            No recent events found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
