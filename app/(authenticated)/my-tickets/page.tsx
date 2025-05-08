"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TicketCard } from "@/components/tickets/ticket-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Calendar, AlertCircle, Ticket, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<{
    upcoming: any[]
    past: any[]
    all: any[]
  }>({
    upcoming: [],
    past: [],
    all: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("/api/tickets/my-tickets?exclude=organizer")

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`Failed to fetch tickets: ${response.status} ${errorData.error || response.statusText}`)
        }

        const data = await response.json()
        setTickets(data.tickets)
      } catch (error) {
        console.error("Error fetching tickets:", error)
        setError(error instanceof Error ? error.message : "Failed to load tickets")
        toast({
          title: "Error",
          description: "Failed to load your tickets. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [toast])

  // Filter tickets by type
  const attendeeTickets =
    tickets.all?.filter((ticket) => ticket.ticketType === "attendee" || ticket.formType === "attendee") || []

  const volunteerTickets =
    tickets.all?.filter((ticket) => ticket.ticketType === "volunteer" || ticket.formType === "volunteer") || []

  const speakerTickets =
    tickets.all?.filter((ticket) => ticket.ticketType === "speaker" || ticket.formType === "speaker") || []

  return (
    <div className="space-y-6 container py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Tickets</h1>
          <p className="text-muted-foreground">
            View tickets for events you're attending, volunteering at, or speaking at
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-indigo-600" />
          <span className="font-medium">{loading ? "..." : tickets.all?.length || 0} Tickets</span>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All ({loading ? "..." : tickets.all?.length || 0})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({loading ? "..." : tickets.upcoming?.length || 0})</TabsTrigger>
          <TabsTrigger value="past">Past ({loading ? "..." : tickets.past?.length || 0})</TabsTrigger>
          <TabsTrigger value="attendee">Attendee ({loading ? "..." : attendeeTickets.length})</TabsTrigger>
          <TabsTrigger value="volunteer">Volunteer ({loading ? "..." : volunteerTickets.length})</TabsTrigger>
          <TabsTrigger value="speaker">Speaker ({loading ? "..." : speakerTickets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : tickets.all?.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-1">
              {tickets.all.map((ticket, index) => (
                <TicketItem
                  key={`${ticket._id}-${ticket.ticketType || ticket.formType || "unknown"}`}
                  ticket={ticket}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="ticket" />
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : tickets.upcoming?.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-1">
              {tickets.upcoming.map((ticket, index) => (
                <TicketItem
                  key={`${ticket._id}-${ticket.ticketType || ticket.formType || "unknown"}`}
                  ticket={ticket}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="upcoming" />
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : tickets.past?.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-1">
              {tickets.past.map((ticket, index) => (
                <TicketItem
                  key={`${ticket._id}-${ticket.ticketType || ticket.formType || "unknown"}`}
                  ticket={ticket}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="past" />
          )}
        </TabsContent>

        <TabsContent value="attendee" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : attendeeTickets.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-1">
              {attendeeTickets.map((ticket, index) => (
                <TicketItem
                  key={`${ticket._id}-${ticket.ticketType || ticket.formType || "unknown"}`}
                  ticket={ticket}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="attendee" />
          )}
        </TabsContent>

        <TabsContent value="volunteer" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : volunteerTickets.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-1">
              {volunteerTickets.map((ticket, index) => (
                <TicketItem
                  key={`${ticket._id}-${ticket.ticketType || ticket.formType || "unknown"}`}
                  ticket={ticket}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="volunteer" />
          )}
        </TabsContent>

        <TabsContent value="speaker" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : speakerTickets.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-1">
              {speakerTickets.map((ticket, index) => (
                <TicketItem
                  key={`${ticket._id}-${ticket.ticketType || ticket.formType || "unknown"}`}
                  ticket={ticket}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="speaker" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// New component to handle both regular tickets and form submission tickets
function TicketItem({ ticket, index }: { ticket: any; index: number }) {
  // Check if this is a form submission or a regular ticket
  if (ticket.isFormSubmission) {
    return <FormSubmissionTicket ticket={ticket} index={index} />
  } else {
    return <TicketCard ticket={ticket} index={index} />
  }
}

// Component to display form submission as a ticket
function FormSubmissionTicket({ ticket, index }: { ticket: any; index: number }) {
  const [showAllDetails, setShowAllDetails] = useState(false)
  const event = ticket.event || {}
  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date not available"

  const formattedTime =
    event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : "Time not specified"

  const roleType = ticket.formType || ticket.ticketType || "attendee"
  const roleColors = {
    attendee: "bg-blue-100 text-blue-800",
    volunteer: "bg-green-100 text-green-800",
    speaker: "bg-purple-100 text-purple-800",
  }

  // Extract name and email from form data
  const getName = () => {
    if (!ticket.formData) return "N/A"

    // Try different possible field names for name
    const nameField =
      ticket.formData.name ||
      ticket.formData.fullName ||
      ticket.formData.firstName ||
      ticket.formData["question_name"] ||
      "N/A"

    return nameField
  }

  const getEmail = () => {
    if (!ticket.formData) return "N/A"

    // Try different possible field names for email
    // Also look for dynamic field names containing "email"
    const emailKeys = Object.keys(ticket.formData).filter(
      (key) => key === "email" || key === "emailAddress" || key.includes("email") || key.includes("Email"),
    )

    return emailKeys.length > 0 ? ticket.formData[emailKeys[0]] : "N/A"
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md relative bg-white border-2 border-dashed border-indigo-300 rounded-lg">
      {/* Ticket stub design element */}
      <div className="absolute top-0 bottom-0 left-10 border-l-2 border-dashed border-indigo-300 z-10"></div>
      <div className="absolute top-0 left-0 w-10 h-full bg-indigo-50 flex items-center justify-center">
        <div className="rotate-90 text-indigo-500 font-bold tracking-wider text-xs whitespace-nowrap">
          TICKET #{ticket._id.substring(0, 6)}
        </div>
      </div>

      <div className="ml-10">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">{event.title || "Event"}</h3>
              <p className="text-sm opacity-90">{formattedDate}</p>
            </div>
            <Badge className={`${roleColors[roleType as keyof typeof roleColors]} capitalize`}>{roleType}</Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{formattedTime}</span>
          </div>

          <div className="flex items-start gap-2 text-sm text-gray-600">
            <div className="h-4 w-4 mt-0.5 flex-shrink-0">📍</div>
            <span>{event.location || "Location not specified"}</span>
          </div>

          {ticket.formData && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-sm mb-2">Application Details:</h4>
              <div className="space-y-2 text-sm">
                {/* Show only name and email initially */}
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500">Name:</span>
                  <span className="col-span-2">{getName()}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500">Email:</span>
                  <span className="col-span-2">{getEmail()}</span>
                </div>

                {/* Show all details when expanded */}
                {showAllDetails && (
                  <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                    {Object.entries(ticket.formData)
                      .filter(
                        ([key]) =>
                          key !== "name" && key !== "email" && !key.includes("Email") && !key.includes("email"),
                      )
                      .map(([key, value]) => (
                        <div key={key} className="grid grid-cols-3 gap-2">
                          <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                          <span className="col-span-2">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                )}

                {/* View More / View Less button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllDetails(!showAllDetails)}
                  className="mt-2 text-indigo-600 hover:text-indigo-800"
                >
                  {showAllDetails ? "View Less" : "View More Details"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-gray-50 p-4 flex justify-between">
          <div className="text-xs text-gray-500">
            Approved on {new Date(ticket.purchasedAt || ticket.createdAt).toLocaleDateString()}
          </div>

          {event.slug && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/events/${event.slug}`}>View Event</Link>
            </Button>
          )}
        </CardFooter>
      </div>
    </Card>
  )
}

function TicketsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-64 w-full" />
      ))}
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <h2 className="text-xl font-semibold">Error Loading Tickets</h2>
      <p className="text-muted-foreground text-center max-w-md">{message}</p>
      <Button onClick={() => window.location.reload()}>Try Again</Button>
    </div>
  )
}

function EmptyState({ type }: { type: "upcoming" | "past" | "attendee" | "volunteer" | "speaker" | "ticket" }) {
  const messages = {
    upcoming: "You don't have any upcoming event tickets.",
    past: "You don't have any past event tickets.",
    attendee: "You don't have any attendee tickets.",
    volunteer: "You don't have any volunteer tickets.",
    speaker: "You don't have any speaker tickets.",
    ticket: "You don't have any tickets yet.",
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12 bg-slate-50 rounded-lg border border-slate-200">
      <Calendar className="h-12 w-12 text-slate-400" />
      <h2 className="text-xl font-semibold">No Tickets Found</h2>
      <p className="text-muted-foreground text-center max-w-md">{messages[type]}</p>
      <Button asChild>
        <Link href="/events">Browse Events</Link>
      </Button>
    </div>
  )
}
