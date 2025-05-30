import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ticket as TicketIcon, Star, Calendar, Clock } from "lucide-react" // Renamed Ticket to avoid conflict
import { connectToDatabase } from "@/lib/mongodb"
import TicketModel from "@/models/Ticket" // Assuming TicketModel is your Mongoose model for tickets
import Review from "@/models/Review" // Assuming Review is your Mongoose model for reviews
import Event from "@/models/Event" // Assuming Event is your Mongoose model for events
import { ObjectId } from "mongodb"

export default async function UserDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  console.log("User dashboard page rendering for user:", session.user.name, "with role:", session.user.role)

  await connectToDatabase()
  const userId = new ObjectId(session.user.id)
  const currentDate = new Date()

  let upcomingTicketsCount = 0
  let totalReviewsCount = 0
  let upcomingRegisteredEventsCount = 0
  let pastRegisteredEventsCount = 0
  let upcomingRegisteredEventsList: any[] = []
  let userTicketsList: any[] = []

  try {
    // Fetch all active tickets for the user and populate event details
    const allUserTickets = await TicketModel.find({ userId: userId, status: "active" })
      .populate<{ event: { _id: ObjectId; title: string; date: Date; location: string; type: string; slug: string } }>({
        path: "event", // Changed from eventId to event
        select: "title date location type slug", // Select fields needed for display
      })
      .sort({ createdAt: -1 }) // Sort tickets by creation date, or event date if preferred
      .lean()

    userTicketsList = allUserTickets.slice(0, 5) // For "My Tickets" tab

    const uniqueUpcomingEventIds = new Set<string>()
    const uniquePastEventIds = new Set<string>()

    allUserTickets.forEach((ticket) => {
      if (ticket.event && ticket.event.date) { // Changed from ticket.eventId to ticket.event
        const eventDate = new Date(ticket.event.date)
        if (eventDate >= currentDate) {
          upcomingTicketsCount++ // Count each ticket for an upcoming event
          if (!uniqueUpcomingEventIds.has(ticket.event._id.toString())) { // Changed from ticket.eventId to ticket.event
            upcomingRegisteredEventsCount++
            if (upcomingRegisteredEventsList.length < 3) {
              // Add to list for display
              upcomingRegisteredEventsList.push({
                ...ticket.event, // Changed from ticket.eventId to ticket.event
                // Ensure date is a Date object if not already, or format as needed
                date: eventDate,
              })
            }
            uniqueUpcomingEventIds.add(ticket.event._id.toString()) // Changed from ticket.eventId to ticket.event
          }
        } else {
          if (!uniquePastEventIds.has(ticket.event._id.toString())) { // Changed from ticket.eventId to ticket.event
            pastRegisteredEventsCount++
            uniquePastEventIds.add(ticket.event._id.toString()) // Changed from ticket.eventId to ticket.event
          }
        }
      }
    })

    // Sort upcomingRegisteredEventsList by date
    upcomingRegisteredEventsList.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Fetch total reviews count
    totalReviewsCount = await Review.countDocuments({ userId: userId })
  } catch (error) {
    console.error("Error fetching user dashboard data:", error)
    // Handle error appropriately, maybe show a message to the user
    // For now, the page will render with 0 counts if an error occurs
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name}! Here's an overview of your activities.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Upcoming Tickets</CardTitle>
            <TicketIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingTicketsCount}</div>
            <p className="text-xs text-muted-foreground">For upcoming events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" /> {/* Corrected icon name */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReviewsCount}</div>
            <p className="text-xs text-muted-foreground">Submitted in total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" /> {/* Corrected icon name */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingRegisteredEventsCount}</div>
            <p className="text-xs text-muted-foreground">You're registered for</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Past Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" /> {/* Corrected icon name */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastRegisteredEventsCount}</div>
            <p className="text-xs text-muted-foreground">Attended in total</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="tickets">My Tickets</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Events you're registered for in the next 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingRegisteredEventsList.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingRegisteredEventsList.map((event) => (
                      <Card key={event._id.toString()}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{event.title}</CardTitle>
                          <CardDescription>
                            {new Date(event.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm">
                            <p>Location: {event.location}</p>
                            <p>Type: {event.type || "General"}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">You have no upcoming events you're registered for.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Tickets</CardTitle>
              <CardDescription>All your event tickets in one place.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userTicketsList.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {userTicketsList.map((ticket) => (
                      <Card key={ticket._id.toString()}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Ticket #{ticket._id.toString().slice(-6)}</CardTitle>
                          <CardDescription>{ticket.event?.title || "Event details unavailable"}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm">
                            <p>
                              Date:{" "}
                              {ticket.event?.date
                                ? new Date(ticket.event.date).toLocaleDateString()
                                : "N/A"}
                            </p>
                            <p>Type: {ticket.ticketType || "Standard"}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">You have no active tickets.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
