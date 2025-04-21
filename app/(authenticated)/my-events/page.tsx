"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Users,
  Mic,
  HandHelping,
  Edit,
  ExternalLink,
  Settings,
  ChevronRight,
  Trash2,
  AlertCircle,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Track which tabs have been loaded
  const [loadedTabs, setLoadedTabs] = useState({
    all: true,
    attending: false,
    volunteering: false,
    speaking: false,
  })

  // Track active tab
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log("Fetching events for user...")

        // Add a client-side timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const response = await fetch("/api/events/my-events", {
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

        // Validate and sanitize each event
        const sanitizedEvents = eventsList.map((event) => ({
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
          userRole: event.userRole || "attendee",
        }))

        setEvents(sanitizedEvents)
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
  }, [toast])

  // Function to fetch role-specific events
  const fetchRoleEvents = async (role: string) => {
    try {
      setLoading(true)

      // Show loading toast
      toast({
        title: `Loading ${role} events`,
        description: "Please wait while we fetch your events...",
      })

      // Here you would make an API call to fetch the specific role events
      // For example:
      // const response = await fetch(`/api/events/my-events?role=${role}`);

      // For now, we'll simulate a delay and filter the existing events
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mark this tab as loaded
      setLoadedTabs((prev) => ({
        ...prev,
        [role]: true,
      }))

      // If we had no events for this role, we could show a message
      if (events.filter((event) => event.userRole === role).length === 0) {
        toast({
          title: "No events found",
          description: `You don't have any ${role} events.`,
        })
      }
    } catch (error) {
      console.error(`Error fetching ${role} events:`, error)
      toast({
        title: "Error",
        description: `Failed to load your ${role} events. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // If this tab hasn't been loaded yet, fetch its data
    if (!loadedTabs[value] && value !== "all") {
      fetchRoleEvents(value)
    }
  }

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  const handleDeleteClick = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation() // Prevent event card click
    setEventToDelete(event)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/events/${eventToDelete._id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete event")
      }

      // Remove the deleted event from the state
      setEvents(events.filter((event) => event._id !== eventToDelete._id))

      toast({
        title: "Event deleted",
        description: `"${eventToDelete.title}" has been successfully deleted.`,
      })
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setEventToDelete(null)
    }
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
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
        <p className="text-muted-foreground">
          View events you've registered for as an attendee, volunteer, or speaker.
        </p>
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
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="attending">Attending</TabsTrigger>
          <TabsTrigger value="volunteering">Volunteering</TabsTrigger>
          <TabsTrigger value="speaking">Speaking</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {loading ? (
            <EventsLoadingSkeleton />
          ) : filteredEvents.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  onClick={() => handleEventClick(event._id, event.userRole || "attendee", event.slug)}
                  onManageClick={(e) => handleManageClick(e, event._id)}
                  onDeleteClick={(e) => handleDeleteClick(e, event)}
                />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </TabsContent>

        <TabsContent value="attending" className="mt-6">
          {loading ? (
            <EventsLoadingSkeleton />
          ) : !loadedTabs.attending ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Button onClick={() => fetchRoleEvents("attending")} className="mb-4">
                Load Attending Events
              </Button>
              <p className="text-muted-foreground">Click to load events you're attending</p>
            </div>
          ) : filteredEvents.filter((e) => e.userRole === "attendee").length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents
                .filter((event) => event.userRole === "attendee")
                .map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    onClick={() => handleEventClick(event._id, "attendee", event.slug)}
                  />
                ))}
            </div>
          ) : (
            <EmptyState role="attending" />
          )}
        </TabsContent>

        <TabsContent value="volunteering" className="mt-6">
          {loading ? (
            <EventsLoadingSkeleton />
          ) : !loadedTabs.volunteering ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Button onClick={() => fetchRoleEvents("volunteering")} className="mb-4">
                Load Volunteering Events
              </Button>
              <p className="text-muted-foreground">Click to load events you're volunteering for</p>
            </div>
          ) : filteredEvents.filter((e) => e.userRole === "volunteer").length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents
                .filter((event) => event.userRole === "volunteer")
                .map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    onClick={() => handleEventClick(event._id, "volunteer", event.slug)}
                  />
                ))}
            </div>
          ) : (
            <EmptyState role="volunteering" />
          )}
        </TabsContent>

        <TabsContent value="speaking" className="mt-6">
          {loading ? (
            <EventsLoadingSkeleton />
          ) : !loadedTabs.speaking ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Button onClick={() => fetchRoleEvents("speaking")} className="mb-4">
                Load Speaking Events
              </Button>
              <p className="text-muted-foreground">Click to load events you're speaking at</p>
            </div>
          ) : filteredEvents.filter((e) => e.userRole === "speaker").length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents
                .filter((event) => event.userRole === "speaker")
                .map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    onClick={() => handleEventClick(event._id, "speaker", event.slug)}
                  />
                ))}
            </div>
          ) : (
            <EmptyState role="speaking" />
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Event
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{eventToDelete?.title}&quot;? This action cannot be undone and will
              remove all associated data including registrations, tickets, and custom forms.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EventCard({ event, onClick, onManageClick, onDeleteClick }) {
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

  // Determine card style based on user role
  const getRoleStyles = () => {
    switch (event.userRole) {
      case "organizer":
        return "border-primary/30 bg-primary/5"
      case "speaker":
        return "border-secondary/30 bg-secondary/5"
      case "volunteer":
        return "border-amber-500/30 bg-amber-500/5"
      case "attendee":
        return "border-emerald-500/30 bg-emerald-500/5"
      default:
        return ""
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

  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md border-2 ${getRoleStyles()}`} onClick={onClick}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{event.title}</CardTitle>
          {getRoleBadge()}
        </div>
        <CardDescription>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Users className="h-3.5 w-3.5" />
            <span>{attendeesCount} attendees</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          {getRoleIcon()}
          <span className="font-medium capitalize">
            {event.userRole === "organizer"
              ? "You're organizing"
              : `You're ${event.userRole === "attendee" ? "attending" : event.userRole === "volunteer" ? "volunteering" : "speaking"}`}
          </span>
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
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onDeleteClick}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" asChild>
              <Link
                href={`/events/${event.slug || event._id}`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Live
              </Link>
            </Button>
          </>
        ) : (
          <Button size="sm" className="w-full" asChild>
            <Link href={`/events/${event._id}`}>View Details</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function EmptyState({ role = "any" }) {
  let message = "You haven't registered for any events yet."
  let icon = <Calendar className="h-12 w-12 text-muted-foreground mb-4" />

  switch (role) {
    case "attending":
      message = "You haven't registered as an attendee for any events yet."
      icon = <User className="h-12 w-12 text-emerald-500/70 mb-4" />
      break
    case "volunteering":
      message = "You haven't signed up as a volunteer for any events yet."
      icon = <HandHelping className="h-12 w-12 text-amber-500/70 mb-4" />
      break
    case "speaking":
      message = "You haven't registered as a speaker for any events yet."
      icon = <Mic className="h-12 w-12 text-secondary/70 mb-4" />
      break
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon}
      <h3 className="text-lg font-medium">No events found</h3>
      <p className="text-muted-foreground mt-2 max-w-md">{message}</p>
      <Button asChild className="mt-6">
        <Link href="/explore">Explore Events</Link>
      </Button>
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
