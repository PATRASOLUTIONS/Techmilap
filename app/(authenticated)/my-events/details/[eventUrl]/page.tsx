import Image from "next/image"
import { Calendar, Clock, MapPin, Users } from "lucide-react"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import User from "@/models/User"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import mongoose from "mongoose"

// Create a fallback component for error handling
function ErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
      <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist or has been removed.</p>
      <Link href="/my-events" className="text-primary hover:underline">
        Back to My Events
      </Link>
    </div>
  )
}

export default async function EventDetailPage({ params }: { params: { eventUrl: string } }) {
  try {
    if (!params?.eventUrl) {
      console.error("No eventUrl parameter provided")
      return <ErrorFallback />
    }

    await connectToDatabase()

    // Try to find the event by slug first
    let event = null
    const eventUrl = params.eventUrl.trim()

    console.log(`Looking for event with URL: ${eventUrl}`)

    try {
      // First try: Check if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(eventUrl)) {
        console.log(`Trying to find event by ID: ${eventUrl}`)
        event = await Event.findById(eventUrl).lean()
      }

      // Second try: If not found by ID or not a valid ID, try by slug (case-insensitive)
      if (!event) {
        console.log(`Trying to find event by slug: ${eventUrl}`)
        event = await Event.findOne({
          slug: { $regex: new RegExp(`^${eventUrl}$`, "i") },
        }).lean()
      }

      // Third try: If still not found, try a more flexible search
      if (!event) {
        console.log(`Trying to find event by partial slug match or title: ${eventUrl}`)
        event = await Event.findOne({
          $or: [{ slug: { $regex: eventUrl, $options: "i" } }, { title: { $regex: eventUrl, $options: "i" } }],
        }).lean()
      }
    } catch (error) {
      console.error("Error finding event:", error)
    }

    if (!event) {
      console.log(`Event not found for URL: ${eventUrl}`)
      return <ErrorFallback />
    }

    console.log(`Found event: ${event.title} (${event._id})`)

    // Fetch organizer information
    let organizer = null
    try {
      if (event.organizer) {
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
    const eventDate = event.date ? new Date(event.date) : new Date()
    const isValidDate = !isNaN(eventDate.getTime())

    // Format date safely
    const formattedDate = isValidDate ? formatDate(eventDate) : "Date not available"

    // Format time safely
    let formattedTime = "Time not available"
    if (event.startTime) {
      try {
        const [hours, minutes] = event.startTime.split(":").map(Number)
        const period = hours >= 12 ? "PM" : "AM"
        const hour12 = hours % 12 || 12
        formattedTime = `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`

        if (event.endTime) {
          const [endHours, endMinutes] = event.endTime.split(":").map(Number)
          const endPeriod = endHours >= 12 ? "PM" : "AM"
          const endHour12 = endHours % 12 || 12
          formattedTime += ` - ${endHour12}:${endMinutes.toString().padStart(2, "0")} ${endPeriod}`
        }
      } catch (error) {
        console.error("Error formatting time:", error)
        formattedTime = "Time not available"
      }
    }

    // Ensure event has an ID for the register button
    const eventId = event._id ? event._id.toString() : ""
    const eventSlug = event.slug || eventId

    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/my-events" className="text-primary hover:underline flex items-center gap-1">
            <span>← Back to My Events</span>
          </Link>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{event.title || "Untitled Event"}</h1>
              <p className="text-muted-foreground">Organized by {organizerName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {event.category || "Event"}
              </Badge>
              <Button asChild>
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
                      target.src = "/community-celebration.png"
                    }}
                  />
                ) : (
                  <Image src="/community-celebration.png" alt="Default event image" fill className="object-cover" />
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
                    <Calendar className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">Date</h3>
                      <p>{formattedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">Time</h3>
                      <p>{formattedTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">Location</h3>
                      <p>{event.location || event.venue || "Location not specified"}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Users className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
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
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-medium text-primary">{organizerInitials}</span>
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
                  <Button asChild className="w-full">
                    <Link href={`/event-dashboard/${eventSlug}`}>Manage Event</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/event-dashboard/${eventSlug}/edit`}>Edit Event</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Unexpected error in EventDetailPage:", error)
    return <ErrorFallback />
  }
}
