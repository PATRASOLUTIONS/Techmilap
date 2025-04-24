"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Users, Eye, Mic, HandHelping } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import ReactMarkdown from "react-markdown"

export default function EventDashboardPage() {
  const { id } = useParams() || {}
  const eventId = Array.isArray(id) ? id[0] : id
  const router = useRouter()
  const { toast } = useToast()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isPublishing, setIsPublishing] = useState(false)
  const [submissionCounts, setSubmissionCounts] = useState({
    attendee: 0,
    volunteer: 0,
    speaker: 0,
  })

  // Add state for form URLs
  const [formUrls, setFormUrls] = useState({
    attendee: "",
    volunteer: "",
    speaker: "",
  })

  // In the useEffect where you fetch the event data, add code to generate the URLs
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log(`Fetching event data for ID: ${eventId}`)

        const response = await fetch(`/api/events/${eventId}`, {
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to fetch event (Status: ${response.status})`)
        }

        const data = await response.json()
        console.log("Event data received:", data)

        if (!data.event) {
          throw new Error("Event data is missing or invalid")
        }

        setEvent(data.event)

        // Generate form URLs
        const baseUrl = window.location.origin
        const eventSlug = data.event.slug || eventId
        setFormUrls({
          attendee: `${baseUrl}/events/${eventSlug}/register`,
          volunteer: `${baseUrl}/events/${eventSlug}/volunteer`,
          speaker: `${baseUrl}/events/${eventSlug}/speaker`,
        })

        // Fetch submission counts
        fetchSubmissionCounts(eventId)
      } catch (error) {
        console.error("Error fetching event:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load event data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    // Check for tab in URL
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.href)
      const tabParam = urlParams.get("tab")
      if (tabParam) {
        setActiveTab(tabParam)
      }
    }

    fetchEvent()
  }, [eventId, toast])

  const fetchSubmissionCounts = async (eventId: string) => {
    if (!eventId) return

    try {
      const response = await fetch(`/api/events/${eventId}/submissions/counts`, {
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (response.ok) {
        const data = await response.json()

        // Handle both formats of response
        if (data.counts) {
          // Old format
          setSubmissionCounts(data.counts)
        } else if (data.attendee && data.volunteer && data.speaker) {
          // New format
          setSubmissionCounts({
            attendee: data.attendee.total || 0,
            volunteer: data.volunteer.total || 0,
            speaker: data.speaker.total || 0,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching submission counts:", error)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Update URL without reloading the page
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("tab", value)
      window.history.pushState({}, "", url)
    }
  }

  const handlePublishToggle = async (checked: boolean) => {
    if (!event || !eventId) return

    try {
      setIsPublishing(true)
      const newStatus = checked ? "published" : "draft"

      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update event status")
      }

      const data = await response.json()
      setEvent(data.event)

      toast({
        title: checked ? "Event Published" : "Event Unpublished",
        description: checked ? "Your event is now visible to the public" : "Your event has been set to draft mode",
      })
    } catch (error) {
      console.error("Error updating event status:", error)
      toast({
        title: "Error",
        description: "Failed to update event status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleEditEvent = () => {
    if (!eventId) return
    // Redirect to the dedicated edit page for this event
    router.push(`/event-dashboard/${eventId}/edit`)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/my-events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex flex-col gap-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded-md"></div>
            <div className="h-5 w-32 bg-muted animate-pulse rounded-md"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/my-events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Event Not Found</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/my-events">Back to My Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Safely access event properties with fallbacks
  const eventTitle = event.title || "Untitled Event"
  const eventStatus = event.status || "draft"
  const eventDate = event.date ? new Date(event.date).toLocaleDateString() : "No date set"
  const eventStartTime = event.startTime || "TBD"
  const eventEndTime = event.endTime || "TBD"
  const eventLocation = event.location || "No location set"
  const eventType = event.type || "Not specified"
  const eventCategory = event.category || "Uncategorized"
  const eventDescription = event.description || "No description available"

  // Safely access form statuses
  const attendeeFormStatus = event.attendeeForm?.status || "draft"
  const volunteerFormStatus = event.volunteerForm?.status || "draft"
  const speakerFormStatus = event.speakerForm?.status || "draft"

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/my-events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{eventTitle}</h1>
            <div className="flex items-center mt-1">
              <Badge variant={eventStatus === "published" ? "default" : "outline"}>
                {eventStatus === "published" ? "Published" : "Draft"}
              </Badge>
              <span className="text-sm text-muted-foreground ml-2">{eventDate}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid grid-cols-6 md:w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
          <TabsTrigger value="speakers">Speakers</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Attendees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{submissionCounts.attendee}</div>
                <p className="text-xs text-muted-foreground">registrations</p>
                <Button variant="link" size="sm" className="mt-2 p-0" asChild>
                  <Link href={`/event-dashboard/${eventId}/attendees`}>View all attendees</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Volunteers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{submissionCounts.volunteer}</div>
                <p className="text-xs text-muted-foreground">applications</p>
                <Button variant="link" size="sm" className="mt-2 p-0" asChild>
                  <Link href={`/event-dashboard/${eventId}/volunteers`}>View all volunteers</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Speakers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{submissionCounts.speaker}</div>
                <p className="text-xs text-muted-foreground">applications</p>
                <Button variant="link" size="sm" className="mt-2 p-0" asChild>
                  <Link href={`/event-dashboard/${eventId}/speakers`}>View all speakers</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Date & Time</h3>
                <p className="font-medium">
                  {eventDate} • {eventStartTime} - {eventEndTime}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                <p className="font-medium">{eventLocation}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                <p className="font-medium">{eventType}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                <p className="font-medium">{eventCategory}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <div className="font-medium mt-2 prose prose-sm max-w-none">
                  <ReactMarkdown>{eventDescription}</ReactMarkdown>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendees" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Attendees</CardTitle>
                <CardDescription>Manage your event attendees</CardDescription>
              </div>
              <Button asChild>
                <Link href={`/event-dashboard/${eventId}/attendees`}>
                  <Users className="mr-2 h-4 w-4" />
                  View All Attendees
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{submissionCounts.attendee} attendees registered for this event.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volunteers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Volunteers</CardTitle>
                <CardDescription>Manage your event volunteers</CardDescription>
              </div>
              <Button asChild>
                <Link href={`/event-dashboard/${eventId}/volunteers`}>
                  <HandHelping className="mr-2 h-4 w-4" />
                  Manage Volunteers
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{submissionCounts.volunteer} volunteer applications received.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="speakers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Speakers</CardTitle>
                <CardDescription>Manage your event speakers</CardDescription>
              </div>
              <Button asChild>
                <Link href={`/event-dashboard/${eventId}/speakers`}>
                  <Mic className="mr-2 h-4 w-4" />
                  Manage Speakers
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{submissionCounts.speaker} speaker applications received.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendee Registration Form</CardTitle>
                <CardDescription>Customize the registration form for attendees</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Form Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {attendeeFormStatus === "published" ? "Published" : "Draft"}
                    </p>
                  </div>
                  <Badge variant={attendeeFormStatus === "published" ? "default" : "outline"}>
                    {attendeeFormStatus === "published" ? "Published" : "Draft"}
                  </Badge>
                </div>

                {attendeeFormStatus === "published" && formUrls.attendee && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-1">Public URL:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-background p-1 rounded flex-1 overflow-x-auto">
                        {formUrls.attendee}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(formUrls.attendee)
                          toast({
                            title: "URL Copied",
                            description: "The public URL has been copied to your clipboard.",
                          })
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-copy"
                        >
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                )}

                {/* <Button asChild className="w-full">
                  <Link href={`/event-dashboard/${eventId}/attendees/customize`}>
                    <FileEdit className="mr-2 h-4 w-4" />
                    Customize Form
                  </Link>
                </Button> */}
                {attendeeFormStatus === "published" && (
                  <div className="flex items-center gap-2 mt-2">
                    <Eye className="h-4 w-4 text-green-500" />
                    <p className="text-sm text-green-600">Form is accepting registrations</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Volunteer Application Form</CardTitle>
                <CardDescription>Customize the application form for volunteers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Form Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {volunteerFormStatus === "published" ? "Published" : "Draft"}
                    </p>
                  </div>
                  <Badge variant={volunteerFormStatus === "published" ? "default" : "outline"}>
                    {volunteerFormStatus === "published" ? "Published" : "Draft"}
                  </Badge>
                </div>

                {volunteerFormStatus === "published" && formUrls.volunteer && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-1">Public URL:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-background p-1 rounded flex-1 overflow-x-auto">
                        {formUrls.volunteer}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(formUrls.volunteer)
                          toast({
                            title: "URL Copied",
                            description: "The public URL has been copied to your clipboard.",
                          })
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-copy"
                        >
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                )}

                {/* <Button asChild className="w-full">
                  <Link href={`/event-dashboard/${eventId}/volunteers/customize`}>
                    <FileEdit className="mr-2 h-4 w-4" />
                    Customize Form
                  </Link>
                </Button> */}
                {volunteerFormStatus === "published" && (
                  <div className="flex items-center gap-2 mt-2">
                    <Eye className="h-4 w-4 text-green-500" />
                    <p className="text-sm text-green-600">Form is accepting applications</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Speaker Application Form</CardTitle>
                <CardDescription>Customize the application form for speakers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Form Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {speakerFormStatus === "published" ? "Published" : "Draft"}
                    </p>
                  </div>
                  <Badge variant={speakerFormStatus === "published" ? "default" : "outline"}>
                    {speakerFormStatus === "published" ? "Published" : "Draft"}
                  </Badge>
                </div>

                {speakerFormStatus === "published" && formUrls.speaker && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-1">Public URL:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-background p-1 rounded flex-1 overflow-x-auto">
                        {formUrls.speaker}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(formUrls.speaker)
                          toast({
                            title: "URL Copied",
                            description: "The public URL has been copied to your clipboard.",
                          })
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-copy"
                        >
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                )}

                {/* <Button asChild className="w-full">
                  <Link href={`/event-dashboard/${eventId}/speakers/customize`}>
                    <FileEdit className="mr-2 h-4 w-4" />
                    Customize Form
                  </Link>
                </Button> */}
                {speakerFormStatus === "published" && (
                  <div className="flex items-center gap-2 mt-2">
                    <Eye className="h-4 w-4 text-green-500" />
                    <p className="text-sm text-green-600">Form is accepting applications</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
