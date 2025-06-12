"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Users, Eye, Mic, HandHelping, SettingsIcon, QrCode } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import ReactMarkdown from "react-markdown"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import MarkdownEditor from "@/components/markdown-editor"
import { EventCreationForm } from "@/components/events/event-creation-form"
import { PublishAllFormsButton } from "@/components/events/publish-all-forms-button"
import { CheckCircle, BarChart } from "lucide-react"

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
  const [isPast, setIsPast] = useState(false);
  const [dataChanged, setDataChanged] = useState(false)


  // Add state for form URLs
  const [formUrls, setFormUrls] = useState({
    attendee: "",
    volunteer: "",
    speaker: "",
  })

  // Add these state variables after the existing useState declarations
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editFormData, setEditFormData] = useState({
    location: "",
    category: "",
    description: "",
  })

  // Add refs to track API call status
  const isFormStatusFetched = useRef(false)
  const isSubmissionCountsFetched = useRef(false)
  const formStatusData = useRef({
    attendeeForm: { status: "draft" },
    volunteerForm: { status: "draft" },
    speakerForm: { status: "draft" },
  })

  // Memoize the fetch event function to prevent unnecessary re-renders
  const fetchEvent = useCallback(async () => {
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

      if (!data) {
        throw new Error("Event data is missing or invalid")
      }

      setEvent(data)

      // Initialize edit form data
      setEditFormData({
        location: data.location || "",
        category: data.category || "",
        description: data.description || "",
      })

      // Generate form URLs
      const baseUrl = window.location.origin
      const eventSlug = data.slug || eventId
      setFormUrls({
        attendee: `${baseUrl}/events/${eventSlug}/register`,
        volunteer: `${baseUrl}/events/${eventSlug}/volunteer`,
        speaker: `${baseUrl}/events/${eventSlug}/speaker`,
      })

      // Fetch submission counts only once
      if (!isSubmissionCountsFetched.current) {
        fetchSubmissionCounts(eventId)
        isSubmissionCountsFetched.current = true
      }

      // Fetch form status only once
      if (!isFormStatusFetched.current) {
        fetchFormStatus(eventId)
        isFormStatusFetched.current = true
      }
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
  }, [eventId, toast, dataChanged])

  // Separate function to fetch form status
  const fetchFormStatus = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/forms/status`, {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      })

      if (response.ok) {
        const data = await response.json()
        formStatusData.current = {
          attendeeForm: data.attendeeForm || { status: "draft" },
          volunteerForm: data.volunteerForm || { status: "draft" },
          speakerForm: data.speakerForm || { status: "draft" },
        }
      }
    } catch (error) {
      console.error("Error fetching form status:", error)
    }
  }

  // Use a separate useEffect for URL tab parameter
  useEffect(() => {
    // Check for tab in URL
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const tabParam = urlParams.get("tab")
      if (tabParam) {
        setActiveTab(tabParam)
      }
    }
  }, [])

  // Main useEffect for fetching event data
  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  // Add this useEffect to initialize the edit form data when the event data is loaded
  useEffect(() => {
    if (event) {
      setEditFormData({
        location: event.location || "",
        category: event.category || "",
        description: event.description || "",
      })

      handlePastEvent();
    }
  }, [event])

  const fetchSubmissionCounts = async (eventId: string) => {
    if (!eventId) return

    try {
      const response = await fetch(`/api/events/${eventId}/submissions/counts`, {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
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

  // Add this function to handle the form submission
  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId) return

    try {
      setIsUpdating(true)

      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: editFormData.location,
          category: editFormData.category,
          description: editFormData.description,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update event details")
      }

      const data = await response.json()
      setEvent(data.event)

      toast({
        title: "Event Updated",
        description: "Your event details have been updated successfully.",
      })

      setIsEditingDetails(false)
    } catch (error) {
      console.error("Error updating event details:", error)
      toast({
        title: "Error",
        description: "Failed to update event details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
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

  // Safely access form statuses from the cached data
  const attendeeFormStatus = formStatusData.current.attendeeForm?.status || "draft"
  const volunteerFormStatus = formStatusData.current.volunteerForm?.status || "draft"
  const speakerFormStatus = formStatusData.current.speakerForm?.status || "draft"

  const handlePastEvent = () => {
    let dateString = event.endDate || event.date;
    let eventEndDate = new Date(dateString);
    eventEndDate.setHours(0, 0, 0, 0);
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    setIsPast(eventEndDate < currentDate)
  }

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
        <TabsList className="grid grid-cols-7 md:w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
          <TabsTrigger value="speakers">Speakers</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="check-in">
            <QrCode className="h-4 w-4 mr-1" />
            Check-in
          </TabsTrigger>
          <TabsTrigger value="settings">
            <SettingsIcon className="h-4 w-4 mr-1" />
            Settings
          </TabsTrigger>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Event Details</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setIsEditingDetails(!isEditingDetails)}>
                {isEditingDetails ? "Cancel" : "Edit Details"}
              </Button>
            </CardHeader>
            <CardContent>
              {isEditingDetails ? (
                <form onSubmit={handleUpdateDetails} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-location">Location</Label>
                      <Input
                        id="edit-location"
                        value={editFormData.location || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-category">Category</Label>
                      <Input
                        id="edit-category"
                        value={editFormData.category || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <MarkdownEditor
                        value={editFormData.description || ""}
                        onChange={(value) => setEditFormData({ ...editFormData, description: value })}
                        placeholder="Event description..."
                        minHeight="200px"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditingDetails(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? "Updating..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              )}
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
          <div className="flex justify-end mb-4">
            <PublishAllFormsButton eventId={id.toString()} onSuccess={() => router.refresh()} />
          </div>
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

        <TabsContent value="check-in" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Event Check-in</CardTitle>
                <CardDescription>Scan tickets and manage attendee check-ins</CardDescription>
              </div>
              <Button asChild>
                <Link href={`/event-dashboard/${eventId}/check-in`}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Go to Check-in
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Use the check-in system to scan tickets and track attendance at your event. You can scan QR codes,
                manually enter ticket IDs, and view real-time check-in statistics.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="border rounded-lg p-4 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                    <QrCode className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium mb-1">Scan QR Codes</h3>
                  <p className="text-sm text-muted-foreground">
                    Quickly scan attendee tickets using your device's camera
                  </p>
                </div>

                <div className="border rounded-lg p-4 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium mb-1">Verify Tickets</h3>
                  <p className="text-sm text-muted-foreground">Instantly verify ticket validity and check-in status</p>
                </div>

                <div className="border rounded-lg p-4 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                    <BarChart className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="font-medium mb-1">Track Attendance</h3>
                  <p className="text-sm text-muted-foreground">Monitor real-time attendance and check-in statistics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* New Settings Tab Content */}
        <TabsContent value="settings" className="space-y-4">
          {isPast ? (
            <Card>
              <CardHeader>
                <CardTitle>Event Settings</CardTitle>
                <CardDescription>Editing for past events is disabled.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This event has already passed, and its settings can no longer be modified.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Event Settings</CardTitle>
                  <CardDescription>Edit all aspects of your event</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Complete Event Editor</h3>
                  <p className="text-muted-foreground mb-4">
                    Make comprehensive changes to your event including details, tickets, and custom questions.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                    <p className="text-sm text-blue-700">
                      Changes made here will be applied immediately. Please review carefully before saving.
                    </p>
                  </div>
                </div>
                <EventCreationForm existingEvent={event} isEditing={true} setDataChanged={setDataChanged} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
