"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, MapPin, Clock, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface Event {
  _id: string
  title: string
  date: string
  endDate?: string
  location: string
  capacity: number
  status: "draft" | "published" | "cancelled" | "completed"
  attendees?: string[] | any[]
  createdAt: string
  updatedAt: string
  slug?: string
  userRole?: "organizer" | "attendee" | "volunteer" | "speaker"
}

export default function PastEventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)

        // Add a client-side timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const response = await fetch("/api/events/past", {
          signal: controller.signal,
          cache: "no-store", // Prevent caching issues
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Failed to fetch past events (${response.status})`)
        }

        const data = await response.json()
        console.log("Past events data:", data)

        // Ensure we have an array of events, even if empty
        const eventsList = Array.isArray(data.events) ? data.events : []

        // Validate and sanitize each event
        const sanitizedEvents = eventsList.map((event) => ({
          _id: event._id || "",
          title: event.title || "Untitled Event",
          date: event.date || new Date().toISOString(),
          location: event.location || "No location specified",
          capacity: event.capacity || 0,
          status: event.status || "completed",
          attendees: Array.isArray(event.attendees) ? event.attendees : [],
          createdAt: event.createdAt || new Date().toISOString(),
          updatedAt: event.updatedAt || new Date().toISOString(),
          slug: event.slug || event._id || "",
          userRole: event.userRole || "attendee",
        }))

        // Sort events by date (most recent first)
        sanitizedEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setEvents(sanitizedEvents)
      } catch (error) {
        console.error("Error fetching past events:", error)
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load past events. Please try again later."

        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [toast])

  // Filter events based on search term
  const filteredEvents = events.filter((event) => {
    return (
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleEventClick = (eventId: string, eventSlug?: string) => {
    if (!eventId) return

    // Use the slug if available, otherwise use the ID
    const eventUrl = eventSlug || eventId
    router.push(`/events/${eventUrl}`)
  }

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Past Events</h1>
          <p className="text-muted-foreground">Browse through events that have already taken place.</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="max-w-sm">
            <Input
              placeholder="Search past events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              disabled
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium">Error Loading Events</h3>
          <p className="text-muted-foreground mt-2 max-w-md">{error}</p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Past Events</h1>
        <p className="text-muted-foreground">Browse through events that have already taken place.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search past events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-9"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-1" />
          <span>Showing {filteredEvents.length} past events</span>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {filteredEvents.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((event) => (
                  <EventCard key={event._id} event={event} onClick={() => handleEventClick(event._id, event.slug)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No past events found</h3>
                {searchTerm ? (
                  <p className="text-muted-foreground mt-2">
                    No past events match your search for &quot;{searchTerm}&quot;.
                  </p>
                ) : (
                  <p className="text-muted-foreground mt-2">There are no past events to display.</p>
                )}
                {searchTerm && (
                  <Button variant="outline" className="mt-4" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function EventCard({ event, onClick }) {
  // Format date
  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Card
      className="overflow-hidden flex flex-col h-full cursor-pointer transition-all hover:shadow-lg relative group bg-white border-slate-200"
      onClick={onClick}
    >
      {/* Diagonal ribbon for completed events */}
      {event.status.toLowerCase() !== "cancelled" && (
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-10">
          <div className="absolute top-[22px] right-[-55px] bg-red-600 text-white font-bold py-1 w-[230px] text-center transform rotate-45 shadow-md">
            <span className="flex items-center justify-center gap-2">
              <span className="text-lg">✕</span> EVENT COMPLETED
            </span>
          </div>
        </div>
      )}

      {/* Cancelled ribbon */}
      {event.status.toLowerCase() === "cancelled" && (
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-10">
          <div className="absolute top-[22px] right-[-55px] bg-gray-600 text-white font-bold py-1 w-[230px] text-center transform rotate-45 shadow-md">
            CANCELLED
          </div>
        </div>
      )}

      <CardHeader className="p-5 pb-3 bg-gradient-to-r from-slate-50 to-white border-b">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold text-primary line-clamp-1">{event.title}</CardTitle>
        </div>
        <CardDescription className="mt-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="truncate">{event.location}</span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 pt-4 flex-grow">
        <div className="flex items-center gap-2 mb-3 p-2.5 bg-slate-50 rounded-md border border-slate-100">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-medium text-slate-800">Past Event</span>
        </div>

        {/* Additional event details could go here */}
        <div className="mt-3 text-sm text-slate-600">
          <p>This event has already taken place. You can view details but registration is closed.</p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between p-4 bg-slate-50 border-t">
        <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
          View Event Details
        </Button>
      </CardFooter>
    </Card>
  )
}

function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-3/4" />
        </div>
        <div className="space-y-2 mt-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full mb-3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3 mt-2" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  )
}
