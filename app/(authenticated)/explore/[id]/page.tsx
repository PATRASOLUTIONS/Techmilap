import { Suspense } from "react"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import User from "@/models/User"
import Image from "next/image"
import { Calendar, Clock, MapPin, Users, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import mongoose from "mongoose"

// Loading component
function EventDetailLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>
        <div className="h-10 w-3/4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-1/2 bg-gray-200 rounded mb-6"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="aspect-video bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-40 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Error fallback component
function ErrorFallback() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/explore" className="text-blue-500 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Explore</span>
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
        <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist or has been removed.</p>
        <Button asChild className="bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700">
          <Link href="/explore">Browse All Events</Link>
        </Button>
      </div>
    </div>
  )
}

// Main event detail component
async function EventDetail({ params }: { params: { id: string } }) {
  try {
    if (!params?.id) {
      console.error("No id parameter provided")
      return <ErrorFallback />
    }

    await connectToDatabase()

    // Try to find the event by ID or slug
    let event = null
    const eventId = params.id.trim()

    console.log(`Looking for event with ID/slug: ${eventId}`)

    try {
      // First try: Check if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(eventId)) {
        console.log(`Trying to find event by ID: ${eventId}`)
        event = await Event.findById(eventId).lean()
      }

      // Second try: If not found by ID or not a valid ID, try by slug (case-insensitive)
      if (!event) {
        console.log(`Trying to find event by slug: ${eventId}`)
        event = await Event.findOne({
          slug: { $regex: new RegExp(`^${eventId}$`, "i") },
        }).lean()
      }

      // Third try: If still not found, try a more flexible search
      if (!event) {
        console.log(`Trying to find event by partial slug match or title: ${eventId}`)
        event = await Event.findOne({
          $or: [{ slug: { $regex: eventId, $options: "i" } }, { title: { $regex: eventId, $options: "i" } }],
        }).lean()
      }
    } catch (error) {
      console.error("Error finding event:", error)
    }

    if (!event) {
      console.log(`Event not found for ID/slug: ${eventId}`)
      return <ErrorFallback />
    }

    console.log(`Found event: ${event.title} (${event._id})`)

    // Fetch organizer information
    let organizer = null
    try {
      if (event.organizer && mongoose.Types.ObjectId.isValid(event.organizer)) {
        organizer = await User.findById(event.organizer).lean()
      }
    } catch (error) {
      console.error("Error fetching organizer:", error)
    }

    // Ensure we have attendees array and it's properly formatted
    const attendees = Array.isArray(event.attendees) ? event.attendees : []

    // Get organizer details - with safer checks
    let organizerName = "Event Organizer"
    let organizerEmail = "No email provided"
    let organizerInitials = "EO"

    if (organizer) {
      if (organizer.firstName && organizer.lastName) {
        organizerName = `${organizer.firstName} ${organizer.lastName}`
        organizerInitials = `${organizer.firstName[0]}${organizer.lastName[0]}`
      } else if (organizer.name) {
        organizerName = organizer.name
        organizerInitials = organizer.name.substring(0, 2).toUpperCase()
      }
      if (organizer.email) {
        organizerEmail = organizer.email
      }
    }

    // Check capacity - with safer checks
    const attendeeCount = Array.isArray(attendees) ? attendees.length : 0
    const capacity = typeof event.capacity === "number" ? event.capacity : 100
    const isAtCapacity = attendeeCount >= capacity

    // Ensure event date is valid
    let eventDate = null
    let isValidDate = false

    try {
      if (event.date) {
        eventDate = new Date(event.date)
        isValidDate = !isNaN(eventDate.getTime())
      }
    } catch (error) {
      console.error("Error parsing date:", error)
    }

    // Format date safely
    const formattedDate = isValidDate ? formatDate(eventDate) : "Date not available"

    // Format time safely
    let formattedTime = "Time not available"
    if (event.startTime) {
      try {
        const [hours, minutes] = event.startTime.split(":").map(Number)
        if (!isNaN(hours) && !isNaN(minutes)) {
          const period = hours >= 12 ? "PM" : "AM"
          const hour12 = hours % 12 || 12
          formattedTime = `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`

          if (event.endTime) {
            const [endHours, endMinutes] = event.endTime.split(":").map(Number)
            if (!isNaN(endHours) && !isNaN(endMinutes)) {
              const endPeriod = endHours >= 12 ? "PM" : "AM"
              const endHour12 = endHours % 12 || 12
              formattedTime += ` - ${endHour12}:${endMinutes.toString().padStart(2, "0")} ${endPeriod}`
            }
          }
        }
      } catch (error) {
        console.error("Error formatting time:", error)
      }
    }

    // Ensure event has an ID for the register button
    const eventSlug = event.slug || event._id.toString()

    // Check if forms are published
    const hasAttendeeForm = event.attendeeForm?.status === "published"
    const hasVolunteerForm = event.volunteerForm?.status === "published"
    const hasSpeakerForm = event.speakerForm?.status === "published"

    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/explore" className="text-blue-500 hover:underline flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Explore</span>
          </Link>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{event.title || "Untitled Event"}</h1>
              <p className="text-muted-foreground">Organized by {organizerName}</p>
            </div>
            <div className="flex items-center gap-2">
              {event.category && (
                <Badge variant="outline" className="text-sm">
                  {event.category}
                </Badge>
              )}
              <Button
                asChild
                className="bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700"
              >
                <Link href={`/events/${eventSlug}`}>View Public Page</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                {event.image ? (
                  <Image
                    src={event.image || "/placeholder.svg"}
                    alt={event.title || "Event image"}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // Fallback to default image on error
                      const target = e.target as HTMLImageElement
                      target.src = "/vibrant-tech-event.png"
                      target.onerror = null // Prevent infinite loop
                    }}
                  />
                ) : (
                  <Image src="/vibrant-tech-event.png" alt="Default event image" fill className="object-cover" />
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>About this event</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{event.description || "No description available."}</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 mr-3 mt-0.5 text-blue-500" />
                    <div>
                      <h3 className="font-medium">Date</h3>
                      <p>{formattedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 mr-3 mt-0.5 text-blue-500" />
                    <div>
                      <h3 className="font-medium">Time</h3>
                      <p>{formattedTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-3 mt-0.5 text-blue-500" />
                    <div>
                      <h3 className="font-medium">Location</h3>
                      <p>{event.location || event.venue || "Location not specified"}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Users className="h-5 w-5 mr-3 mt-0.5 text-blue-500" />
                    <div>
                      <h3 className="font-medium">Attendees</h3>
                      <p>
                        {attendeeCount} / {capacity}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Organizer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="font-medium text-blue-600">{organizerInitials}</span>
                    </div>
                    <div>
                      <p className="font-medium">{organizerName}</p>
                      <p className="text-sm text-muted-foreground">{organizerEmail}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {hasAttendeeForm && !isAtCapacity ? (
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700"
                    >
                      <Link href={`/events/${eventSlug}/register`}>Register for Event</Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700"
                    >
                      <Link href={`/events/${eventSlug}`}>View Event Details</Link>
                    </Button>
                  )}

                  {hasVolunteerForm && (
                    <Button asChild variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Link href={`/events/${eventSlug}/volunteer`}>Volunteer Application</Link>
                    </Button>
                  )}

                  {hasSpeakerForm && (
                    <Button asChild variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Link href={`/events/${eventSlug}/speaker`}>Speaker Application</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Unexpected error in EventDetail:", error)
    return <ErrorFallback />
  }
}

// Export the page component with Suspense for better loading experience
export default function EventDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<EventDetailLoading />}>
      <EventDetail params={params} />
    </Suspense>
  )
}
