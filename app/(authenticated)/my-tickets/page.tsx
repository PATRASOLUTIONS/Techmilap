"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TicketCard } from "@/components/tickets/ticket-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Calendar, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<{ upcoming: any[]; past: any[] }>({
    upcoming: [],
    past: [],
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Tickets</h1>
          <p className="text-muted-foreground">View and manage your tickets for upcoming and past events</p>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({loading ? "..." : tickets.upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({loading ? "..." : tickets.past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : tickets.upcoming.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          ) : tickets.past.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tickets.past.map((ticket, index) => (
                <TicketCard key={`${ticket._id}-${ticket.ticketType}`} ticket={ticket} index={index} />
              ))}
            </div>
          ) : (
            <EmptyState type="past" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TicketsLoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <h2 className="text-xl font-semibold">Error</h2>
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}

function EmptyState({ type }: { type: "upcoming" | "past" }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Calendar className="h-8 w-8" />
      <h2 className="text-xl font-semibold">No {type} Tickets</h2>
      <p className="text-muted-foreground">You don't have any {type} tickets yet.</p>
      {type === "upcoming" && (
        <Button asChild>
          <Link href="/">Browse Events</Link>
        </Button>
      )}
    </div>
  )
}
