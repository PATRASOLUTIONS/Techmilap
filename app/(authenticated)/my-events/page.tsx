"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Calendar,
  Mic,
  HandHelping,
  Edit,
  ExternalLink,
  Settings,
  User,
  MapPin,
  ChevronRight,
  Clock,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession } from "next-auth/react"

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
  applicationDetails?: {
    [key: string]: any
  }
}

interface FormSubmission {
  _id: string
  eventId: string
  formType: "attendee" | "volunteer" | "speaker"
  status: "pending" | "approved" | "rejected"
  createdAt: string
  event?: {
    title: string
    date: string
    location: string
    slug?: string
  }
}

export default function MyEventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [events, setEvents] = useState<Event[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [pastEvents, setPastEvents] = useState<Event[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get("role")
  const [activeTab, setActiveTab] = useState(roleParam || "all")
  const { data: session } = useSession()

  // Check if user is an event planner or super admin
  const isEventPlanner = session?.user?.role === "event-planner" || session?.user?.role === "super-admin"

  // Set default tab based on user role
  const [defaultTab, setDefaultTab] = useState(isEventPlanner ? "organized" : "applications")

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Set default tab based on user role when session loads
    if (session) {
      setDefaultTab(isEventPlanner ? "organized" : "applications")
    }
  }, [session, isEventPlanner])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)

        // Only fetch organized events if user is an event planner
        if (isEventPlanner) {
          console.log("Fetching events for event planner...")

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
            applicationDetails: event.applicationDetails || {},
          }))

          setEvents(sanitizedEvents)

          // Sort events into upcoming and past based on current time
          sortEvents(sanitizedEvents, currentTime)
        }

        // Always fetch pending submissions for all users
        await fetchPendingSubmissions()
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
  }, [toast, currentTime, isEventPlanner, session])

  // Function to fetch pending submissions
  const fetchPendingSubmissions = async () => {
    try {
      const response = await fetch("/api/submissions/my-pending", {
        cache: "no-store",
      })

      if (!response.ok) {
        console.error("Failed to fetch pending submissions:", response.statusText)
        return
      }

      const data = await response.json()
      console.log("Pending submissions:", data)

      if (Array.isArray(data.submissions)) {
        setPendingSubmissions(data.submissions)
      }
    } catch (error) {
      console.error("Error fetching pending submissions:", error)
    }
  }

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

  // For regular users, just show the applications tab without tabs UI
  if (!isEventPlanner) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
        </div>
        <div className="flex flex-col space-y-2">
          <p className="text-muted-foreground">
            View events you've applied for. Check the status of your applications.
          </p>
        </div>

        <div className="mt-6">
          {loading ? (
            <EventsLoadingSkeleton />
          ) : (
            <div className="space-y-10">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                  Pending Applications ({pendingSubmissions.length})
                </h2>
                {pendingSubmissions.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {pendingSubmissions.map((submission) => (
                      <SubmissionCard
                        key={submission._id}
                        submission={submission}
                        onClick={() => {
                          if (submission.event?.slug) {
                            router.push(`/events/${submission.event.slug}`)
                          } else {
                            router.push(`/events/${submission.eventId}`)
                          }
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Pending Applications</h3>
                    <p className="text-muted-foreground mt-2 max-w-md">
                      You don't have any pending applications for events.
                    </p>
                    <Button className="mt-6" asChild>
                      <Link href="/explore">Explore Events</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // For event planners, show both tabs
  return (
    <div className="space-y-6">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="organized">Organized Events</TabsTrigger>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="organized">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight">My Organized Events</h1>
          </div>
          <div className="flex flex-col space-y-2">
            <p className="text-muted-foreground">
              View events you're organizing. Create, manage and track your events.
            </p>
          </div>

          <div className="flex items-center justify-between mt-4">
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
        </TabsContent>

        <TabsContent value="applications">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
          </div>
          <div className="flex flex-col space-y-2">
            <p className="text-muted-foreground">
              View events you've applied for. Check the status of your applications.
            </p>
          </div>

          <div className="mt-6">
            {loading ? (
              <EventsLoadingSkeleton />
            ) : (
              <div className="space-y-10">
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                    Pending Applications ({pendingSubmissions.length})
                  </h2>
                  {pendingSubmissions.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {pendingSubmissions.map((submission) => (
                        <SubmissionCard
                          key={submission._id}
                          submission={submission}
                          onClick={() => {
                            if (submission.event?.slug) {
                              router.push(`/events/${submission.event.slug}`)
                            } else {
                              router.push(`/events/${submission.eventId}`)
                            }
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No Pending Applications</h3>
                      <p className="text-muted-foreground mt-2 max-w-md">
                        You don't have any pending applications for events.
                      </p>
                      <Button className="mt-6" asChild>
                        <Link href="/explore">Explore Events</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SubmissionCard({ submission, onClick }) {
  // Format the date with fallback
  const formattedDate = submission.event?.date
    ? new Date(submission.event.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date not specified"

  // Get the appropriate icon and text for the form type
  const getFormTypeInfo = (formType) => {
    switch (formType) {
      case "attendee":
        return { icon: <User className="h-4 w-4 text-emerald-500" />, text: "Attendee Registration" }
      case "volunteer":
        return { icon: <HandHelping className="h-4 w-4 text-amber-500" />, text: "Volunteer Application" }
      case "speaker":
        return { icon: <Mic className="h-4 w-4 text-blue-500" />, text: "Speaker Application" }
      default:
        return { icon: <User className="h-4 w-4 text-gray-500" />, text: "Application" }
    }
  }

  const formTypeInfo = getFormTypeInfo(submission.formType)

  // Get the appropriate status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <AlertCircle className="h-3 w-3 mr-1" /> Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Unknown
          </Badge>
        )
    }
  }

  return (
    <Card
      className="overflow-hidden flex flex-col h-full cursor-pointer transition-all hover:shadow-lg relative group bg-white border-slate-200"
      onClick={onClick}
    >
      <CardHeader className="p-5 pb-3 bg-gradient-to-r from-slate-50 to-white border-b">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold text-primary line-clamp-1">
            {submission.event?.title || "Event"}
          </CardTitle>
        </div>
        <CardDescription className="mt-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="truncate">{submission.event?.location || "Location not specified"}</span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 pt-4 flex-grow">
        <div className="flex items-center gap-2 mb-3 p-2.5 bg-slate-50 rounded-md border border-slate-100">
          {formTypeInfo.icon}
          <span className="font-medium text-slate-800">{formTypeInfo.text}</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-md bg-slate-50">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="text-slate-700">
              Submitted on{" "}
              {new Date(submission.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          {getStatusBadge(submission.status)}
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

  // Find email from dynamic field names in applicationDetails
  const findEmailFromApplicationDetails = (details?: { [key: string]: any }): string | null => {
    if (!details) return null

    // Look for fields that match the pattern question_email_*
    const emailFieldKeys = Object.keys(details).filter(
      (key) => key.startsWith("question_email_") || key.includes("/email") || key.includes("email"),
    )

    if (emailFieldKeys.length === 0) return null

    // For each potential email field, try to extract an email
    for (const key of emailFieldKeys) {
      const value = details[key]
      if (!value || typeof value !== "string") continue

      // Extract email using regex
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      const match = value.match(emailRegex)
      if (match) return match[0]
    }

    return null
  }

  // Get email from application details
  const contactEmail = findEmailFromApplicationDetails(event.applicationDetails)

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
      className="overflow-hidden flex flex-col h-full cursor-pointer transition-all hover:shadow-lg relative group bg-white border-slate-200"
      onClick={handleCardClick}
    >
      {/* Diagonal ribbon for completed events */}
      {isPast && event.status.toLowerCase() !== "cancelled" && (
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
          <Edit className="h-4 w-4 text-primary" />
          <span className="font-medium text-slate-800">{getParticipationStatus()}</span>
        </div>

        {event.userRole === "organizer" && (
          <>
            <h3 className="font-medium mb-2 text-slate-800">Form Management</h3>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4 text-primary" />
                  <span className="text-slate-700">Event Page</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>

              <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2">
                  <HandHelping className="h-4 w-4 text-primary" />
                  <span className="text-slate-700">Volunteer Form</span>
                </div>
                {hasVolunteerForm ? (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Configured
                  </Badge>
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-primary" />
                  <span className="text-slate-700">Speaker Form</span>
                </div>
                {hasSpeakerForm ? (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Configured
                  </Badge>
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>

            {/* Application Details Section */}
            {contactEmail && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                <h4 className="font-medium text-blue-700 mb-1 flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  Contact Email
                </h4>
                <p className="text-sm text-blue-600 break-all">{contactEmail}</p>
              </div>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-between p-4 bg-slate-50 border-t">
        {event.userRole === "organizer" ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onManageClick(e)
              }}
              className="bg-white hover:bg-slate-100"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
            <Button size="sm" asChild className="bg-primary hover:bg-primary/90">
              <Link href={`/events/${event.slug || event._id}`} target="_blank" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Live
              </Link>
            </Button>
          </>
        ) : (
          <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
            View Details
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
