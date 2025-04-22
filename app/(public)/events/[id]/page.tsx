"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarIcon, MapPinIcon, InfoIcon, Loader2, Share2, Calendar, Users, Clock } from "lucide-react"
import { format } from "date-fns"
import { PublicEventRegisterButton } from "@/components/events/public-event-register-button"
import Link from "next/link"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

  // Calculate days remaining
  const daysRemaining = eventDate ? Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24)) : null
  const eventStatus =
    daysRemaining > 0
      ? `${daysRemaining} days remaining`
      : eventDate && daysRemaining <= 0
        ? "Event has ended"
        : "Date TBA"

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-6">
        <Link href="/events" className="text-primary hover:underline flex items-center gap-1">
          <span>← Back to Events</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Event Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            {/* Event Image */}
            <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-lg">
              <Image
                src={event.image || "/placeholder.svg?height=600&width=600&query=event"}
                alt={event.title}
                fill
                className="object-cover"
              />
              {event.category && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary/90 hover:bg-primary text-white px-3 py-1 text-sm">
                    {event.category}
                  </Badge>
                </div>
              )}
            </div>

            {/* Event Actions */}
            <Card className="border-none shadow-md bg-white">
              <CardContent className="p-6 space-y-6">
                {/* Event Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="font-medium">{eventStatus}</span>
                  </div>
                  <Button variant="ghost" size="icon" title="Share Event">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>

                {/* Registration Buttons */}
                <div className="space-y-3">
                  {isAttendeeFormPublished && (
                    <PublicEventRegisterButton
                      eventId={event.slug || eventIdOrSlug}
                      formType="register"
                      isFormPublished={isAttendeeFormPublished}
                      className="w-full"
                    />
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <PublicEventRegisterButton
                      eventId={event.slug || eventIdOrSlug}
                      formType="volunteer"
                      variant="outline"
                      isFormPublished={isVolunteerFormPublished}
                      className="w-full"
                    />
                    <PublicEventRegisterButton
                      eventId={event.slug || eventIdOrSlug}
                      formType="speaker"
                      variant="outline"
                      isFormPublished={isSpeakerFormPublished}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Key Event Details */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{formattedDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{formattedTime}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <MapPinIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{event.location || "Location TBA"}</p>
                    </div>
                  </div>

                  {event.capacity && (
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Capacity</p>
                        <p className="font-medium">{event.capacity} attendees</p>
                      </div>
                    </div>
                  )}

                  {event.price !== undefined && (
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <InfoIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-medium">{event.price === 0 ? "Free" : `$${event.price}`}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Organizer Info (if available) */}
                {event.organizer && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-3">Organized by</p>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src="/diverse-group-city.png" />
                        <AvatarFallback>{event.organizer.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{event.organizer}</p>
                        <p className="text-sm text-muted-foreground">Event Organizer</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Event Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Event Header */}
          <div>
            <h1 className="text-4xl font-bold mb-4 text-gradient">{event.title}</h1>

            {/* Tags/Categories */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {event.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Event Description */}
          <Card className="border-none shadow-md bg-white overflow-hidden">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-4">About This Event</h2>
              <div className="prose max-w-none">
                {event.description ? (
                  <ReactMarkdown>{event.description}</ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground italic">No description available.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Event Schedule (if available) */}
          {event.schedule && (
            <Card className="border-none shadow-md bg-white overflow-hidden">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold mb-4">Event Schedule</h2>
                <div className="prose max-w-none">
                  <ReactMarkdown>{event.schedule}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Details (if available) */}
          {event.details && (
            <Card className="border-none shadow-md bg-white overflow-hidden">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold mb-4">Additional Information</h2>
                <div className="prose max-w-none">
                  <ReactMarkdown>{event.details}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Call to Action */}
          <Card className="border-none shadow-md bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Ready to join this event?</h3>
                <p className="text-muted-foreground">Secure your spot now before registration closes.</p>
              </div>
              <PublicEventRegisterButton
                eventId={event.slug || eventIdOrSlug}
                formType="register"
                isFormPublished={isAttendeeFormPublished}
                className="min-w-[150px]"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
