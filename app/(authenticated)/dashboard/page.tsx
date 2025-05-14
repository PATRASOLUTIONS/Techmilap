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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Ensure the user has the correct role
  if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
    redirect("/user-dashboard")
  }

  // Sample data - in a real app, this would come from your database
  const stats = {
    totalEvents: 12,
    activeEvents: 5,
    totalAttendees: 1324,
    ticketsSold: 987,
  }

  const upcomingEvents = [
    {
      id: 1,
      title: "Tech Conference 2023",
      date: "2023-06-15T09:00:00",
      location: "Convention Center, New York",
      attendees: 250,
      image: "/bustling-tech-summit.png",
      registrations: 320,
      capacity: 400,
    },
    {
      id: 2,
      title: "Digital Marketing Workshop",
      date: "2023-06-22T10:00:00",
      location: "Business Hub, San Francisco",
      attendees: 120,
      image: "/vibrant-tech-event.png",
      registrations: 150,
      capacity: 200,
    },
    {
      id: 3,
      title: "Startup Networking Mixer",
      date: "2023-06-28T18:00:00",
      location: "Innovation Center, Austin",
      attendees: 85,
      image: "/contemporary-city-center.png",
      registrations: 100,
      capacity: 150,
    },
  ]

  const speakers = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      role: "AI Research Scientist",
      image: "/confident-asian-professional.png",
      events: 3,
      rating: 4.8,
    },
    {
      id: 2,
      name: "Michael Rodriguez",
      role: "Marketing Director",
      image: "/confident-leader.png",
      events: 5,
      rating: 4.9,
    },
    {
      id: 3,
      name: "Aisha Patel",
      role: "Tech Entrepreneur",
      image: "/confident-indian-professional.png",
      events: 2,
      rating: 4.7,
    },
  ]

  const volunteers = [
    {
      id: 1,
      name: "James Wilson",
      role: "Event Setup",
      image: "/joyful-portrait.png",
      events: 7,
      status: "Available",
    },
    {
      id: 2,
      name: "Elena Martinez",
      role: "Registration Desk",
      image: "/joyful-latino-portrait.png",
      events: 4,
      status: "Available",
    },
    {
      id: 3,
      name: "Thomas Lee",
      role: "Technical Support",
      image: "/confident-blonde-professional.png",
      events: 5,
      status: "Busy",
    },
  ]

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
        totalEvents={stats.totalEvents}
        activeEvents={stats.activeEvents}
        totalAttendees={stats.totalAttendees}
        ticketsSold={stats.ticketsSold}
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
                      <span className="text-sm font-medium text-green-600">+24%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                        style={{ width: "72%" }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Attendee Engagement</span>
                      <span className="text-sm font-medium text-green-600">+18%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                        style={{ width: "65%" }}
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
                    <div className="flex items-start gap-3 pb-3 border-b">
                      <Badge className="bg-green-500 h-2 w-2 rounded-full p-0 mt-2" />
                      <div>
                        <p className="text-sm font-medium">New registration for Tech Conference</p>
                        <p className="text-xs text-gray-500">10 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 pb-3 border-b">
                      <Badge className="bg-blue-500 h-2 w-2 rounded-full p-0 mt-2" />
                      <div>
                        <p className="text-sm font-medium">Speaker confirmed for Workshop</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="bg-amber-500 h-2 w-2 rounded-full p-0 mt-2" />
                      <div>
                        <p className="text-sm font-medium">Venue change for Networking Mixer</p>
                        <p className="text-xs text-gray-500">Yesterday</p>
                      </div>
                    </div>
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
            <GradientCard>
              <Card className="bg-white/80 backdrop-blur-sm border-0 overflow-hidden">
                <div className="md:flex">
                  <div className="relative h-48 md:h-auto md:w-2/5">
                    <Image
                      src={upcomingEvents[0].image || "/placeholder.svg"}
                      alt={upcomingEvents[0].title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center justify-center md:hidden">
                      <h3 className="text-white text-xl font-bold px-4">{upcomingEvents[0].title}</h3>
                    </div>
                  </div>
                  <div className="p-6 md:w-3/5">
                    <h3 className="text-xl font-bold hidden md:block">{upcomingEvents[0].title}</h3>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        <span>
                          {new Date(upcomingEvents[0].date).toLocaleDateString("en-US", {
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
                          {new Date(upcomingEvents[0].date).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                        <span>{upcomingEvents[0].location}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-2 text-blue-600" />
                        <span>
                          {upcomingEvents[0].registrations} registrations (
                          {Math.round((upcomingEvents[0].registrations / upcomingEvents[0].capacity) * 100)}% capacity)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          style={{ width: `${(upcomingEvents[0].registrations / upcomingEvents[0].capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button asChild>
                        <Link href={`/event-dashboard/${upcomingEvents[0].id}`}>
                          Manage Event
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/event-dashboard/${upcomingEvents[0].id}/check-in`}>Check-in Portal</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </GradientCard>
          </div>
        </TabsContent>

        {/* Upcoming Events Tab */}
        <TabsContent value="upcoming" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
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
                          {new Date(event.date).toLocaleTimeString("en-US", {
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {speakers.map((speaker) => (
              <Card key={speaker.id} className="overflow-hidden">
                <div className="flex items-center p-6">
                  <Avatar className="h-16 w-16 border-2 border-blue-100">
                    <AvatarImage src={speaker.image || "/placeholder.svg"} alt={speaker.name} />
                    <AvatarFallback>
                      {speaker.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {volunteers.map((volunteer) => (
              <Card key={volunteer.id} className="overflow-hidden">
                <div className="flex items-center p-6">
                  <Avatar className="h-16 w-16 border-2 border-blue-100">
                    <AvatarImage src={volunteer.image || "/placeholder.svg"} alt={volunteer.name} />
                    <AvatarFallback>
                      {volunteer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
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
