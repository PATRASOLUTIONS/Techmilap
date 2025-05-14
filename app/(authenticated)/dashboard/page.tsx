import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EventStats } from "@/components/dashboard/event-stats"
import { GradientCard } from "@/components/ui/gradient-card"
import Link from "next/link"
import Image from "next/image"
import {
  Users,
  Clock,
  ArrowRight,
  PlusCircle,
  Megaphone,
  HandHelping,
  TrendingUp,
  Calendar,
  MapPin,
  Bell,
  BarChart3,
  Ticket,
  UserPlus,
  Mail,
  MessageSquare,
  Search,
  ChevronRight,
} from "lucide-react"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import User from "@/models/User"
import Review from "@/models/Review"
import FormSubmission from "@/models/FormSubmission"
import TicketModel from "@/models/Ticket"
import { formatDistanceToNow } from "date-fns"

// Helper function to get initials from name
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Ensure the user has the correct role
  if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
    redirect("/user-dashboard")
  }

  // Connect to database
  await connectToDatabase()

  // Get current user ID
  const userId = session.user.id

  // Fetch event statistics
  const currentDate = new Date()
  const totalEvents = await Event.countDocuments({ organizer: userId })
  const activeEvents = await Event.countDocuments({
    organizer: userId,
    date: { $gte: currentDate },
    status: { $in: ["published", "active"] },
  })

  // Get all event IDs for this organizer
  const userEvents = await Event.find({ organizer: userId }, { _id: 1 })
  const eventIds = userEvents.map((event) => event._id)

  // Count total attendees across all events
  const totalAttendees = await TicketModel.countDocuments({
    eventId: { $in: eventIds },
  })

  // Count tickets sold
  const ticketsSold = await TicketModel.countDocuments({
    eventId: { $in: eventIds },
    status: "active",
  })

  // Fetch upcoming events
  const upcomingEvents = await Event.find({
    organizer: userId,
    date: { $gte: currentDate },
    status: { $in: ["published", "active"] },
  })
    .sort({ date: 1 })
    .limit(3)
    .lean()

  // Calculate registrations for each event
  const eventsWithRegistrations = await Promise.all(
    upcomingEvents.map(async (event) => {
      const registrations = await TicketModel.countDocuments({
        eventId: event._id,
      })
      return {
        ...event,
        registrations,
        id: event._id.toString(),
        image: event.image || "/bustling-tech-summit.png",
      }
    }),
  )

  // Fetch recent notifications (using tickets and submissions as notifications)
  const recentTickets = await TicketModel.find({
    eventId: { $in: eventIds },
  })
    .sort({ createdAt: -1 })
    .limit(2)
    .populate("eventId", "title")
    .lean()

  const recentSubmissions = await FormSubmission.find({
    eventId: { $in: eventIds },
  })
    .sort({ createdAt: -1 })
    .limit(2)
    .populate("eventId", "title")
    .lean()

  // Combine and sort notifications
  const notifications = [
    ...recentTickets.map((ticket) => ({
      type: "registration",
      eventTitle: ticket.eventId?.title || "Unknown Event",
      time: ticket.createdAt,
    })),
    ...recentSubmissions.map((submission) => ({
      type: submission.formType,
      eventTitle: submission.eventId?.title || "Unknown Event",
      time: submission.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 3)

  // Fetch speakers (users who have submitted speaker forms)
  const speakerSubmissions = await FormSubmission.find({
    eventId: { $in: eventIds },
    formType: "speaker",
    status: "approved",
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()

  const speakerUserIds = [...new Set(speakerSubmissions.map((sub) => sub.userId))]
  const speakerUsers = await User.find({
    _id: { $in: speakerUserIds },
  })
    .limit(3)
    .lean()

  // Get speaker ratings from reviews
  const speakers = await Promise.all(
    speakerUsers.map(async (user) => {
      const speakerEvents = await FormSubmission.countDocuments({
        userId: user._id,
        formType: "speaker",
        status: "approved",
      })

      const speakerReviews = await Review.find({
        targetType: "speaker",
        targetId: user._id,
      })

      const avgRating =
        speakerReviews.length > 0
          ? speakerReviews.reduce((sum, review) => sum + review.rating, 0) / speakerReviews.length
          : 4.5 // Default rating if no reviews

      return {
        id: user._id.toString(),
        name: `${user.firstName} ${user.lastName}`,
        role: user.jobTitle || "Speaker",
        image: user.profileImage || `/confident-leader.png`,
        events: speakerEvents,
        rating: Number.parseFloat(avgRating.toFixed(1)),
      }
    }),
  )

  // Fetch volunteers (users who have submitted volunteer forms)
  const volunteerSubmissions = await FormSubmission.find({
    eventId: { $in: eventIds },
    formType: "volunteer",
    status: "approved",
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()

  const volunteerUserIds = [...new Set(volunteerSubmissions.map((sub) => sub.userId))]
  const volunteerUsers = await User.find({
    _id: { $in: volunteerUserIds },
  })
    .limit(3)
    .lean()

  // Get volunteer status and events
  const volunteers = await Promise.all(
    volunteerUsers.map(async (user) => {
      const volunteerEvents = await FormSubmission.countDocuments({
        userId: user._id,
        formType: "volunteer",
        status: "approved",
      })

      // Check if volunteer is assigned to any upcoming events
      const upcomingAssignments = await FormSubmission.findOne({
        userId: user._id,
        formType: "volunteer",
        status: "approved",
        eventId: {
          $in: await Event.find({ date: { $gte: currentDate } }, { _id: 1 }).then((events) => events.map((e) => e._id)),
        },
      })

      return {
        id: user._id.toString(),
        name: `${user.firstName} ${user.lastName}`,
        role: user.jobTitle || "Event Assistant",
        image: user.profileImage || `/joyful-portrait.png`,
        events: volunteerEvents,
        status: upcomingAssignments ? "Busy" : "Available",
      }
    }),
  )

  // Get performance metrics
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const ticketsLast30Days = await TicketModel.countDocuments({
    eventId: { $in: eventIds },
    createdAt: { $gte: thirtyDaysAgo },
  })

  const ticketsPrevious30Days = await TicketModel.countDocuments({
    eventId: { $in: eventIds },
    createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
  })

  const ticketGrowth = ticketsPrevious30Days
    ? Math.round(((ticketsLast30Days - ticketsPrevious30Days) / ticketsPrevious30Days) * 100)
    : 0

  // Calculate attendee engagement (using form submissions as a proxy)
  const engagementLast30Days = await FormSubmission.countDocuments({
    eventId: { $in: eventIds },
    createdAt: { $gte: thirtyDaysAgo },
  })

  const engagementPrevious30Days = await FormSubmission.countDocuments({
    eventId: { $in: eventIds },
    createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
  })

  const engagementGrowth = engagementPrevious30Days
    ? Math.round(((engagementLast30Days - engagementPrevious30Days) / engagementPrevious30Days) * 100)
    : 0

  return (
    <div className="space-y-8 pb-10">
      {/* Header with welcome message and quick actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Planner Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {session.user.name}! Here's an overview of your events and activities.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
            <Link href="/dashboard/events/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/explore">
              <Search className="mr-2 h-4 w-4" />
              Explore Events
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats overview */}
      <EventStats
        totalEvents={totalEvents}
        activeEvents={activeEvents}
        totalAttendees={totalAttendees}
        ticketsSold={ticketsSold}
      />

      {/* Main content with tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="speakers">Speakers</TabsTrigger>
          <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick insights section */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <GradientCard gradientFrom="from-blue-500/10" gradientTo="to-indigo-500/10">
              <Card className="bg-white/80 backdrop-blur-sm h-full border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
                    Event Performance
                  </CardTitle>
                  <CardDescription>Last 30 days activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ticket Sales</span>
                      <span className={`text-sm font-medium ${ticketGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {ticketGrowth >= 0 ? "+" : ""}
                        {ticketGrowth}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                        style={{ width: `${Math.min(Math.max(ticketGrowth, 0), 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Attendee Engagement</span>
                      <span
                        className={`text-sm font-medium ${engagementGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {engagementGrowth >= 0 ? "+" : ""}
                        {engagementGrowth}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                        style={{ width: `${Math.min(Math.max(engagementGrowth, 0), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="ml-auto" asChild>
                    <Link href="/dashboard/analytics">
                      View Analytics
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </GradientCard>

            <GradientCard gradientFrom="from-purple-500/10" gradientTo="to-pink-500/10">
              <Card className="bg-white/80 backdrop-blur-sm h-full border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Bell className="mr-2 h-5 w-5 text-purple-600" />
                    Recent Notifications
                  </CardTitle>
                  <CardDescription>Updates from your events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.length > 0 ? (
                      notifications.map((notification, index) => (
                        <div key={index} className="flex items-start gap-3 pb-3 border-b">
                          <Badge
                            className={`h-2 w-2 rounded-full p-0 mt-2 ${
                              notification.type === "registration"
                                ? "bg-green-500"
                                : notification.type === "speaker"
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                            }`}
                          />
                          <div>
                            <p className="text-sm font-medium">
                              {notification.type === "registration"
                                ? `New registration for ${notification.eventTitle}`
                                : notification.type === "speaker"
                                  ? `Speaker application for ${notification.eventTitle}`
                                  : `Volunteer application for ${notification.eventTitle}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.time), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Bell className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">No recent notifications</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="ml-auto">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </GradientCard>

            <GradientCard gradientFrom="from-amber-500/10" gradientTo="to-orange-500/10">
              <Card className="bg-white/80 backdrop-blur-sm h-full border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <BarChart3 className="mr-2 h-5 w-5 text-amber-600" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Manage your events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/event-check-in">
                        <Ticket className="mr-2 h-4 w-4 text-amber-600" />
                        Manage Check-ins
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/settings/email-templates">
                        <Mail className="mr-2 h-4 w-4 text-amber-600" />
                        Email Attendees
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/event-reviews">
                        <MessageSquare className="mr-2 h-4 w-4 text-amber-600" />
                        View Feedback
                      </Link>
                    </Button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="ml-auto" asChild>
                    <Link href="/my-events">
                      All Events
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </GradientCard>
          </div>

          {/* Next upcoming event highlight */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Next Event</h2>
            {eventsWithRegistrations.length > 0 ? (
              <GradientCard>
                <Card className="bg-white/80 backdrop-blur-sm border-0 overflow-hidden">
                  <div className="md:flex">
                    <div className="relative h-48 md:h-auto md:w-2/5">
                      <Image
                        src={eventsWithRegistrations[0].image || "/placeholder.svg"}
                        alt={eventsWithRegistrations[0].title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center justify-center md:hidden">
                        <h3 className="text-white text-xl font-bold px-4">{eventsWithRegistrations[0].title}</h3>
                      </div>
                    </div>
                    <div className="p-6 md:w-3/5">
                      <h3 className="text-xl font-bold hidden md:block">{eventsWithRegistrations[0].title}</h3>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                          <span>
                            {new Date(eventsWithRegistrations[0].date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-blue-600" />
                          <span>
                            {eventsWithRegistrations[0].startTime
                              ? eventsWithRegistrations[0].startTime
                              : new Date(eventsWithRegistrations[0].date).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{eventsWithRegistrations[0].location}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-blue-600" />
                          <span>
                            {eventsWithRegistrations[0].registrations} registrations (
                            {Math.round(
                              (eventsWithRegistrations[0].registrations / eventsWithRegistrations[0].capacity) * 100,
                            )}
                            % capacity)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            style={{
                              width: `${
                                (eventsWithRegistrations[0].registrations / eventsWithRegistrations[0].capacity) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <Button asChild>
                          <Link href={`/event-dashboard/${eventsWithRegistrations[0].id}`}>
                            Manage Event
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={`/event-dashboard/${eventsWithRegistrations[0].id}/check-in`}>
                            Check-in Portal
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </GradientCard>
            ) : (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center">
                  <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No upcoming events</h3>
                  <p className="text-muted-foreground mb-6">You don't have any upcoming events scheduled.</p>
                  <Button asChild>
                    <Link href="/dashboard/events/create">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Your First Event
                    </Link>
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Upcoming Events Tab */}
        <TabsContent value="upcoming" className="space-y-6">
          {eventsWithRegistrations.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {eventsWithRegistrations.map((event) => (
                <GradientCard key={event.id}>
                  <Card className="bg-white/80 backdrop-blur-sm border-0 h-full flex flex-col">
                    <div className="relative h-40">
                      <Image
                        src={event.image || "/placeholder.svg"}
                        alt={event.title}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end">
                        <h3 className="text-white text-lg font-bold p-4">{event.title}</h3>
                      </div>
                    </div>
                    <CardContent className="pt-4 flex-grow">
                      <div className="space-y-3">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                          <span>
                            {new Date(event.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-blue-600" />
                          <span>
                            {event.startTime
                              ? event.startTime
                              : new Date(event.date).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-blue-600" />
                          <span>
                            {event.registrations} / {event.capacity} registered
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            style={{ width: `${(event.registrations / event.capacity) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/event-dashboard/${event.id}`}>
                          Manage Event
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </GradientCard>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center">
                <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium mb-2">No upcoming events</h3>
                <p className="text-muted-foreground mb-6">You don't have any upcoming events scheduled.</p>
                <Button asChild>
                  <Link href="/dashboard/events/create">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Event
                  </Link>
                </Button>
              </div>
            </Card>
          )}
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/my-events">
                View All Events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>

        {/* Speakers Tab */}
        <TabsContent value="speakers" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Featured Speakers</h2>
            <Button asChild>
              <Link href="/dashboard/speakers/connect">
                <UserPlus className="mr-2 h-4 w-4" />
                Connect with Speakers
              </Link>
            </Button>
          </div>
          {speakers.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {speakers.map((speaker) => (
                <Card key={speaker.id} className="overflow-hidden">
                  <div className="flex items-center p-6">
                    <Avatar className="h-16 w-16 border-2 border-blue-100">
                      <AvatarImage src={speaker.image || "/placeholder.svg"} alt={speaker.name} />
                      <AvatarFallback>{getInitials(speaker.name)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4">
                      <h3 className="font-semibold">{speaker.name}</h3>
                      <p className="text-sm text-muted-foreground">{speaker.role}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {speaker.events} events
                        </span>
                        <span className="text-xs ml-2 flex items-center text-amber-600">★ {speaker.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/speakers/${speaker.id}`}>View Profile</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/speakers/${speaker.id}/invite`}>
                        <Megaphone className="mr-2 h-3 w-3" />
                        Invite
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center">
                <Megaphone className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium mb-2">No speakers found</h3>
                <p className="text-muted-foreground mb-6">
                  You don't have any speakers associated with your events yet.
                </p>
                <Button asChild>
                  <Link href="/dashboard/speakers/connect">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Find Speakers
                  </Link>
                </Button>
              </div>
            </Card>
          )}
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/dashboard/speakers">
                View All Speakers
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>

        {/* Volunteers Tab */}
        <TabsContent value="volunteers" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Available Volunteers</h2>
            <Button asChild>
              <Link href="/dashboard/volunteers/connect">
                <UserPlus className="mr-2 h-4 w-4" />
                Connect with Volunteers
              </Link>
            </Button>
          </div>
          {volunteers.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {volunteers.map((volunteer) => (
                <Card key={volunteer.id} className="overflow-hidden">
                  <div className="flex items-center p-6">
                    <Avatar className="h-16 w-16 border-2 border-blue-100">
                      <AvatarImage src={volunteer.image || "/placeholder.svg"} alt={volunteer.name} />
                      <AvatarFallback>{getInitials(volunteer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4">
                      <h3 className="font-semibold">{volunteer.name}</h3>
                      <p className="text-sm text-muted-foreground">{volunteer.role}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {volunteer.events} events
                        </span>
                        <span
                          className={`text-xs ml-2 px-2 py-0.5 rounded-full ${
                            volunteer.status === "Available"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {volunteer.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/volunteers/${volunteer.id}`}>View Profile</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/volunteers/${volunteer.id}/invite`}>
                        <HandHelping className="mr-2 h-3 w-3" />
                        Recruit
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center">
                <HandHelping className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium mb-2">No volunteers found</h3>
                <p className="text-muted-foreground mb-6">
                  You don't have any volunteers associated with your events yet.
                </p>
                <Button asChild>
                  <Link href="/dashboard/volunteers/connect">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Find Volunteers
                  </Link>
                </Button>
              </div>
            </Card>
          )}
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/dashboard/volunteers">
                View All Volunteers
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
