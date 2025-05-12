"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, Ticket, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import Image from "next/image"

export default function MyTicketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchTickets()
    }
  }, [status, router])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/tickets/my-tickets")

      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.status}`)
      }

      const data = await response.json()
      setTickets(Array.isArray(data.tickets) ? data.tickets : [])
    } catch (err) {
      console.error("Error fetching tickets:", err)
      setError(err.message || "Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return <LoadingState message="Checking authentication..." />
  }

  if (loading) {
    return <LoadingState message="Loading your tickets..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchTickets} />
  }

  if (!tickets || tickets.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="container py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
          <p className="text-muted-foreground mt-1">View and manage your event tickets</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Ticket className="h-3.5 w-3.5" />
          <span>{tickets.length} Tickets</span>
        </Badge>
      </div>

      <TicketTabs tickets={tickets} />
    </div>
  )
}

function TicketTabs({ tickets }) {
  // Filter tickets by type and date
  const upcomingTickets = tickets.filter((ticket) => {
    try {
      const eventDate = new Date(ticket.date || ticket.event?.date || Date.now())
      return eventDate >= new Date()
    } catch (e) {
      return true // If date parsing fails, include in upcoming
    }
  })

  const pastTickets = tickets.filter((ticket) => {
    try {
      const eventDate = new Date(ticket.date || ticket.event?.date || 0)
      return eventDate < new Date()
    } catch (e) {
      return false // If date parsing fails, don't include in past
    }
  })

  return (
    <Tabs defaultValue="all">
      <TabsList className="mb-4">
        <TabsTrigger value="all">All Tickets ({tickets.length})</TabsTrigger>
        <TabsTrigger value="upcoming">Upcoming ({upcomingTickets.length})</TabsTrigger>
        <TabsTrigger value="past">Past ({pastTickets.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-4">
        {tickets.map((ticket, index) => (
          <TicketCard key={ticket._id || `ticket-${index}`} ticket={ticket} />
        ))}
      </TabsContent>

      <TabsContent value="upcoming" className="space-y-4">
        {upcomingTickets.length > 0 ? (
          upcomingTickets.map((ticket, index) => <TicketCard key={ticket._id || `upcoming-${index}`} ticket={ticket} />)
        ) : (
          <p className="text-center py-8 text-muted-foreground">No upcoming tickets found</p>
        )}
      </TabsContent>

      <TabsContent value="past" className="space-y-4">
        {pastTickets.length > 0 ? (
          pastTickets.map((ticket, index) => <TicketCard key={ticket._id || `past-${index}`} ticket={ticket} />)
        ) : (
          <p className="text-center py-8 text-muted-foreground">No past tickets found</p>
        )}
      </TabsContent>
    </Tabs>
  )
}

function TicketCard({ ticket }) {
  // Extract ticket data with fallbacks
  const id = ticket._id || "unknown"
  const title = ticket.title || ticket.event?.title || "Event"
  const location = ticket.location || ticket.event?.location || "Location not specified"
  const image = ticket.image || ticket.event?.image || "/vibrant-tech-event.png"

  // Format date safely
  let formattedDate = "Date not specified"
  try {
    const date = new Date(ticket.date || ticket.event?.date)
    if (!isNaN(date.getTime())) {
      formattedDate = format(date, "MMMM d, yyyy")
    }
  } catch (e) {
    console.error("Date formatting error:", e)
  }

  // Format time safely
  let formattedTime = "Time not specified"
  try {
    const startTime = ticket.startTime || ticket.event?.startTime
    const endTime = ticket.endTime || ticket.event?.endTime

    if (startTime && endTime) {
      formattedTime = `${startTime} - ${endTime}`
    } else if (startTime) {
      formattedTime = startTime
    }
  } catch (e) {
    console.error("Time formatting error:", e)
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-1/4 h-48 md:h-auto">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover"
            onError={(e) => {
              // @ts-ignore
              e.target.src = "/vibrant-tech-event.png"
              e.currentTarget.onerror = null
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden"></div>
          <div className="absolute bottom-0 left-0 right-0 p-4 md:hidden">
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
        </div>

        <div className="p-6 flex-1">
          <h3 className="text-xl font-bold hidden md:block">{title}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{formattedDate}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="font-medium">{formattedTime}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{location}</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button asChild>
              <Link href={`/tickets/${id}`}>View Ticket</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/tickets/${id}/download`} target="_blank">
                Download
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function LoadingState({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">{message}</p>
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-6">{message}</p>
      <Button onClick={onRetry}>Try Again</Button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center">
      <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">No tickets found</h2>
      <p className="text-muted-foreground mb-6">
        You don't have any tickets yet. Browse events and register to get tickets.
      </p>
      <Button asChild>
        <Link href="/events">Browse Events</Link>
      </Button>
    </div>
  )
}
