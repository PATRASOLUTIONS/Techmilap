"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, MapPinIcon, UsersIcon, ClockIcon, TagIcon, InfoIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { PublicEventRegisterButton } from "@/components/events/public-event-register-button"
import Link from "next/link"
import Image from "next/image"

export default function EventPage() {
  const params = useParams()
  const eventIdOrSlug = Array.isArray(params.id) ? params.id[0] : params.id

  const [event, setEvent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/events/${eventIdOrSlug}`, {
          headers: {
            "x-public-request": "true",
          },
        })

        if (!response.ok) {
          throw new Error(`Event not found or not available (${response.status})`)
        }

        const data = await response.json()
        setEvent(data.event)
      } catch (error) {
        console.error("Error fetching event:", error)
        setError(error.message || "Failed to load event")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [eventIdOrSlug])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading event details...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button asChild variant="outline">
            <Link href="/events">Back to Events</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-yellow-700 mb-2">Event Not Found</h2>
          <p className="text-yellow-600 mb-4">The event you're looking for could not be found.</p>
          <Button asChild variant="outline">
            <Link href="/events">Browse Events</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Check if forms are published
  const isAttendeeFormPublished = event.attendeeForm?.status === "published"
  const isVolunteerFormPublished = event.volunteerForm?.status === "published"
  const isSpeakerFormPublished = event.speakerForm?.status === "published"

  // Format date and time
  const eventDate = event.date ? new Date(event.date) : null
  const formattedDate = eventDate ? format(eventDate, "EEEE, MMMM d, yyyy") : "Date TBA"
  const formattedTime = eventDate ? format(eventDate, "h:mm a") : "Time TBA"

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        {/* Event Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <div className="flex flex-wrap gap-2">
              <PublicEventRegisterButton
                eventId={eventIdOrSlug}
                formType="register"
                isFormPublished={isAttendeeFormPublished}
              />
              <PublicEventRegisterButton
                eventId={eventIdOrSlug}
                formType="volunteer"
                variant="outline"
                isFormPublished={isVolunteerFormPublished}
              />
              <PublicEventRegisterButton
                eventId={eventIdOrSlug}
                formType="speaker"
                variant="outline"
                isFormPublished={isSpeakerFormPublished}
              />
            </div>
          </div>

          {/* Event Image */}
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden mb-6">
            <Image
              src={event.image || "/placeholder.svg?height=400&width=800&query=event"}
              alt={event.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Event Details */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-2">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium">Date</h3>
                    <p>{formattedDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ClockIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium">Time</h3>
                    <p>{formattedTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPinIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium">Location</h3>
                    <p>{event.location || "Location TBA"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <UsersIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium">Capacity</h3>
                    <p>{event.capacity || "Unlimited"}</p>
                  </div>
                </div>
                {event.category && (
                  <div className="flex items-start gap-2">
                    <TagIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium">Category</h3>
                      <p>{event.category}</p>
                    </div>
                  </div>
                )}
                {event.price !== undefined && (
                  <div className="flex items-start gap-2">
                    <InfoIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium">Price</h3>
                      <p>{event.price === 0 ? "Free" : `$${event.price}`}</p>
                    </div>
                  </div>
                )}
              </div>

              <Tabs defaultValue="description">
                <TabsList className="mb-4">
                  <TabsTrigger value="description">Description</TabsTrigger>
              
                  {event.schedule && <TabsTrigger value="schedule">Schedule</TabsTrigger>}
                </TabsList>
                <TabsContent value="description" className="space-y-4">
                  <div className="prose max-w-none">
                    <p>{event.description}</p>
                  </div>
                </TabsContent>
                <TabsContent value="details" className="space-y-4">
                  <div className="prose max-w-none">
                    {event.details ? (
                      <div dangerouslySetInnerHTML={{ __html: event.details }} />
                    ) : (
                      <p>No additional details available.</p>
                    )}
                  </div>
                </TabsContent>
                {event.schedule && (
                  <TabsContent value="schedule" className="space-y-4">
                    <div className="prose max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: event.schedule }} />
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>

       
      </div>
    </div>
  )
}
