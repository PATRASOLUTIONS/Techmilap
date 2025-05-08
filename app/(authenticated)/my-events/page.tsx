"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Calendar,
  Users,
  Mic,
  HandHelping,
  Edit,
  ExternalLink,
  Settings,
  User,
  MapPin,
  ChevronRight,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  status: "draft" | "published" | "cancelled" | "completed" | "active"
  attendees?: string[] | any[]
  customQuestions?: {
    attendee?: any[]
    volunteer?: any[]
    speaker?: any[]
  }
  createdAt: string
  updatedAt: string
  slug?: string
  userRole?: "organizer" | "attendee" | "volunteer" | "speaker"
}

export default function MyEventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [events, setEvents] = useState<Event[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [pastEvents, setPastEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get("role")
  const [activeTab, setActiveTab] = useState(roleParam || "all")

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log("Fetching events for user...")

        // Add a client-side timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        // Fetch only events where user is an organizer
        const response = await fetch(`/api/events/my-events/all?role=organizer`, {
          signal: controller.signal,
          cache: "no-store", // Prevent caching issues
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          let errorMessage = "Failed to fetch events"
          try {
            const errorData = await response.json()
            console.error("Error response:", errorData)
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            console.error("Could not parse error response")
          }
          throw new Error(`${errorMessage} (${response.status} ${response.statusText})`)
        }

        const data = await response.json()
        console.log("Events data received:", data)

        // Ensure we have an array of events, even if empty
        const eventsList = Array.isArray(data.events) ? data.events : []
        console.log(`Found ${eventsList.length} events`)

        // Filter to only include events where user is an organizer
        const organizerEvents = eventsList.filter((event) => event.userRole === "organizer")

        // Validate and sanitize each event
        const sanitizedEvents = organizerEvents.map((event) => ({
          _id: event._id || "",
          title: event.title || "Untitled Event",
          date: event.date || new Date().toISOString(),
          location: event.location || "No location specified",
          capacity: event.capacity || 0,
          status: event.status || "draft",
          attendees: Array.isArray(event.attendees) ? event.attendees : [],
          customQuestions: event.customQuestions || {},
          createdAt: event.createdAt || new Date().toISOString(),
          updatedAt: event.updatedAt || new Date().toISOString(),
          slug: event.slug || event._id || "",
          userRole: "organizer", // Force organizer role
        }))

        setEvents(sanitizedEvents)

        // Sort events into upcoming and past based on current time
        sortEvents(sanitizedEvents, currentTime)
      } catch (error) {
        console.error("Error fetching events:", error)
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load your events. Please try again later."

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
  }, [toast, currentTime])

  // Function to sort events into upcoming and past
  const sortEvents = (events: Event[], currentDate: Date) => {
    const upcoming: Event[] = []
    const past: Event[] = []

    events.forEach((event) => {
      const eventDate = new Date(event.date)
      if (eventDate >= currentDate) {
        upcoming.push(event)
      } else {
        past.push(event)
      }
    })

    // Sort upcoming events by date (closest first)
    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Sort past events by date (most recent first)
    past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setUpcomingEvents(upcoming)
    setPastEvents(past)
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // Update URL with the selected role for better bookmarking/sharing
    const params = new URLSearchParams(searchParams)
    if (value === "all") {
      params.delete("role")
    } else {
      params.set("role", value)
    }

    router.replace(`/my-events?${params.toString()}`, { scroll: false })
  }

  // Filter events based on search term and active tab
  const getFilteredEvents = (eventsList: Event[]) => {
    return eventsList.filter((event) => {
      // Filter by search term
      return (
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }

  const filteredEvents = getFilteredEvents([...upcomingEvents, ...pastEvents])

  // Update the handleEventClick function to use the event slug if available
  const handleEventClick = (eventId: string, userRole: string, eventSlug?: string) => {
    if (!eventId) return

    // Use the slug if available, otherwise use the ID
    const eventUrl = eventSlug || eventId

    // If user is an organizer, go to event dashboard, otherwise go to event details
    if (userRole === "organizer") {
      router.push(`/event-dashboard/${eventId}`)
    } else {
      router.push(`/my-events/details/${eventUrl}`)
    }
  }

  const handleManageClick = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation() // Prevent event card click
    if (!eventId) return

    // Show loading toast
    toast({
      title: "Loading event dashboard",
      description: "Please wait while we prepare your event dashboard...",
    })

    // Navigate to the event dashboard
    router.push(`/event-dashboard/${eventId}`)
  }

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
        </div>

        <div className="flex items-center justify-between">
          <div className="max-w-sm">
            <Input
              placeholder="Search events..."
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Organized Events</h1>
      </div>
      <div className="flex flex-col space-y-2">
        <p className="text-muted-foreground">View events you're organizing. Create, manage and track your events.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="max-w-sm">
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-1" />
          <span>Last updated: {currentTime.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <EventsLoadingSkeleton />
        ) : (
          <div className="space-y-10">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Your Events ({filteredEvents.length})
              </h2>
              {filteredEvents.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredEvents.map((event) => (
                    <EventCard
                      key={`${event._id}-${event.userRole}`}
                      event={event}
                      onClick={() => handleEventClick(event._id, event.userRole || "organizer", event.slug)}
                      onManageClick={(e) => handleManageClick(e, event._id)}
                      isPast={new Date(event.date) < currentTime}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState role="organizer" type="all" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EventCard({ event, onClick, onManageClick, isPast = false }) {
  // Safely format the date with fallback
  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date not specified"

  // Safely check for volunteer and speaker forms
  const customQuestions = event.customQuestions || {}
  const hasVolunteerForm =
    customQuestions.volunteer && Array.isArray(customQuestions.volunteer) && customQuestions.volunteer.length > 0
  const hasSpeakerForm =
    customQuestions.speaker && Array.isArray(customQuestions.speaker) && customQuestions.speaker.length > 0

  // Safely get attendees count
  const attendeesCount = event.attendees && Array.isArray(event.attendees) ? event.attendees.length : 0

  // Determine card style based on user role and past status
  const getRoleStyles = () => {
    // Add opacity for past events
    const pastModifier = isPast ? "opacity-75 " : ""

    switch (event.userRole) {
      case "organizer":
        return `${pastModifier}border-primary/30 bg-primary/5`
      case "speaker":
        return `${pastModifier}border-secondary/30 bg-secondary/5`
      case "volunteer":
        return `${pastModifier}border-amber-500/30 bg-amber-500/5`
      case "attendee":
        return `${pastModifier}border-emerald-500/30 bg-emerald-500/5`
      default:
        return pastModifier
    }
  }

  // Get role icon
  const getRoleIcon = () => {
    switch (event.userRole) {
      case "organizer":
        return <Edit className="h-4 w-4 text-primary" />
      case "speaker":
        return <Mic className="h-4 w-4 text-secondary" />
      case "volunteer":
        return <HandHelping className="h-4 w-4 text-amber-500" />
      case "attendee":
        return <User className="h-4 w-4 text-emerald-500" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  // Get role badge
  const getRoleBadge = () => {
    switch (event.userRole) {
      case "organizer":
        return <Badge className="bg-primary/20 text-primary border-primary/30">Organizer</Badge>
      case "speaker":
        return <Badge className="bg-secondary/20 text-secondary border-secondary/30">Speaker</Badge>
      case "volunteer":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Volunteer</Badge>
      case "attendee":
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Attendee</Badge>
      default:
        return null
    }
  }

  // Get status badge based on event status
  const getStatusBadge = () => {
    if (!event.status) return null

    // If the event is in the past, show a "Completed" badge regardless of status
    if (isPast && event.status.toLowerCase() !== "cancelled") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Completed
        </Badge>
      )
    }

    switch (event.status.toLowerCase()) {
      case "published":
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Active
          </Badge>
        )
      case "draft":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Draft
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelled
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Completed
          </Badge>
        )
      default:
        return null
    }
  }

  // Format participation status message
  const getParticipationStatus = () => {
    const pastPrefix = isPast ? "You were " : "You're "

    switch (event.userRole) {
      case "organizer":
        return `${pastPrefix}organizing this event`
      case "speaker":
        return `${pastPrefix}speaking at this event`
      case "volunteer":
        return `${pastPrefix}volunteering at this event`
      case "attendee":
        return `${pastPrefix}attending this event`
      default:
        return `${pastPrefix}registered for this event`
    }
  }

  const handleCardClick = () => {
    onClick()
  }

  return (
    <Card
      className="overflow-hidden flex flex-col h-full cursor-pointer transition-shadow hover:shadow-md relative"
      onClick={handleCardClick}
    >
      {/* Add completed overlay for past events */}
      {isPast && event.status.toLowerCase() !== "cancelled" && (
        <div className="absolute inset-0 overflow-hidden z-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-35deg] bg-green-500/20 text-green-700 font-bold text-2xl py-2 px-8 border-2 border-green-500/30 rounded-md w-[150%] text-center">
            COMPLETED
          </div>
        </div>
      )}

      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{event.title}</CardTitle>
          <div className="flex gap-2">
            {getStatusBadge()}
            {getRoleBadge()}
          </div>
        </div>
        <CardDescription>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Users className="h-3.5 w-3.5" />
            <span>
              {attendeesCount} / {event.capacity || "∞"} attendees
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-md">
          {getRoleIcon()}
          <span className="font-medium">{getParticipationStatus()}</span>
        </div>

        {event.userRole === "organizer" && (
          <>
            <h3 className="font-medium mb-2">Form Management</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors">
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4 text-primary" />
                  <span>Event Page</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors">
                <div className="flex items-center gap-2">
                  <HandHelping className="h-4 w-4 text-primary" />
                  <span>Volunteer Form</span>
                </div>
                {hasVolunteerForm ? (
                  <Badge variant="outline" className="text-xs">
                    Configured
                  </Badge>
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-primary" />
                  <span>Speaker Form</span>
                </div>
                {hasSpeakerForm ? (
                  <Badge variant="outline" className="text-xs">
                    Configured
                  </Badge>
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {event.userRole === "organizer" ? (
          <>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onManageClick}>
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
            <Button size="sm" asChild>
              <Link href={`/events/${event.slug || event._id}`} target="_blank" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Live
              </Link>
            </Button>
          </>
        ) : (
          <Button size="sm" className="w-full" asChild>
            <Link href={`/my-events/details/${event.slug || event._id}`}>View Details</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function EmptyState({ role = "any", type = "upcoming" }) {
  let message = `You haven't registered for any ${type} events yet.`
  let icon = <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
  let actionText = "Explore Events"
  let actionLink = "/explore"

  if (type === "all") {
    message = `You don't have any events.`
  }

  if (type === "past") {
    message = `You don't have any past events.`
  }

  switch (role) {
    case "attendee":
      message =
        type === "upcoming"
          ? "You haven't registered as an attendee for any upcoming events yet. Browse our event listings to find events to attend."
          : "You haven't attended any past events yet."
      icon = <User className="h-12 w-12 text-emerald-500/70 mb-4" />
      break
    case "volunteer":
      message =
        type === "upcoming"
          ? "You haven't signed up as a volunteer for any upcoming events yet. Check out events that need volunteers."
          : "You haven't volunteered at any past events yet."
      icon = <HandHelping className="h-12 w-12 text-amber-500/70 mb-4" />
      break
    case "speaker":
      message =
        type === "upcoming"
          ? "You haven't registered as a speaker for any upcoming events yet. Find events looking for speakers."
          : "You haven't spoken at any past events yet."
      icon = <Mic className="h-12 w-12 text-secondary/70 mb-4" />
      break
    case "organizer":
      message =
        type === "upcoming"
          ? "You haven't created any upcoming events yet. Start organizing your first event!"
          : "You haven't organized any past events yet."
      icon = <Edit className="h-12 w-12 text-primary/70 mb-4" />
      actionText = "Create Event"
      actionLink = "/create-event"
      break
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon}
      <h3 className="text-lg font-medium">No {type} events found</h3>
      <p className="text-muted-foreground mt-2 max-w-md">{message}</p>
      <div className="flex gap-4 mt-6">
        <Button asChild variant="outline">
          <Link href="/explore">Explore Events</Link>
        </Button>
        {(role === "any" || role === "organizer") && type === "upcoming" && (
          <Button asChild>
            <Link href="/create-event">Create an Event</Link>
          </Button>
        )}
      </div>
    </div>
  )
}

function EventsLoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-2 mt-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-1/3 mb-2" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
