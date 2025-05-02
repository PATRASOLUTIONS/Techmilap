"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TicketCard } from "@/components/tickets/ticket-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Calendar, AlertCircle, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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

        const response = await fetch("/api/tickets/my-tickets")

        if (!response.ok) {
          throw new Error(`Failed to fetch tickets: ${response.status} ${response.statusText}`)
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
  const attendeeTickets = tickets.all?.filter((ticket) => ticket.ticketType === "attendee") || []
  const volunteerTickets = tickets.all?.filter((ticket) => ticket.ticketType === "volunteer") || []
  const speakerTickets = tickets.all?.filter((ticket) => ticket.ticketType === "speaker") || []

  return (
    <div className="space-y-6 container py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Tickets</h1>
          <p className="text-muted-foreground">View and manage your tickets for upcoming and past events</p>
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
                <TicketCard key={`${ticket._id}-${ticket.ticketType}`} ticket={ticket} index={index} />
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
                <TicketCard key={`${ticket._id}-${ticket.ticketType}`} ticket={ticket} index={index} />
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
                <TicketCard key={`${ticket._id}-${ticket.ticketType}`} ticket={ticket} index={index} />
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
                <TicketCard key={`${ticket._id}-${ticket.ticketType}`} ticket={ticket} index={index} />
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
                <TicketCard key={`${ticket._id}-${ticket.ticketType}`} ticket={ticket} index={index} />
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
                <TicketCard key={`${ticket._id}-${ticket.ticketType}`} ticket={ticket} index={index} />
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
