import { Suspense } from "react"
import Image from "next/image"
import { CalendarIcon, MapPinIcon, Clock, Users, Tag, Ticket } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { connectToDatabase } from "@/lib/mongodb"

// Fallback component for loading state
function EventSkeleton() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="mb-6">
        <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="relative aspect-video bg-gray-200 rounded-lg animate-pulse"></div>
          <div>
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
            <div className="w-20 h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to safely format dates
function formatEventDate(dateString) {
  if (!dateString) return "Date TBA"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Date TBA"
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    return "Date TBA"
  }
}

// Helper function to safely format time
function formatEventTime(timeString) {
  if (!timeString) return "Time TBA"
  try {
    if (typeof timeString === "string" && timeString.length <= 5 && timeString.includes(":")) {
      const [hours, minutes] = timeString.split(":").map(Number)
      const period = hours >= 12 ? "PM" : "AM"
      const hour12 = hours % 12 || 12
      return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`
    }
    const date = new Date(timeString)
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    }
    return "Time TBA"
  } catch (error) {
    return "Time TBA"
  }
}

// Event not found component
function EventNotFound() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
      <p className="mb-6">We couldn't find the event you're looking for.</p>
      <Button asChild>
        <Link href="/events">Browse Events</Link>
      </Button>
    </div>
  )
}

// Error component
function EventError() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      <p className="mb-6">We couldn't load this event. Please try again later.</p>
      <Button asChild>
        <Link href="/events">Back to Events</Link>
      </Button>
    </div>
  )
}

// Main event component
async function EventContent({ id }) {
  try {
    // Connect to database
    await connectToDatabase()

    // Import models dynamically
    const mongoose = (await import("mongoose")).default
    const Event = mongoose.models.Event || mongoose.model("Event", new mongoose.Schema({}))
    const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}))

    // Try to find event
    let event = null

    // Try by ID
    if (mongoose.isValidObjectId(id)) {
      event = await Event.findById(id).lean()
    }

    // Try by slug
    if (!event) {
      event = await Event.findOne({ slug: id }).lean()
    }

    // If still not found, return not found component
    if (!event) {
      return <EventNotFound />
    }

    // Prepare organizer info
    let organizerName = "Event Organizer"
    if (event.organizer && mongoose.isValidObjectId(event.organizer)) {
      try {
        const organizer = await User.findById(event.organizer).lean()
        if (organizer) {
          if (organizer.firstName || organizer.lastName) {
            organizerName = `${organizer.firstName || ""} ${organizer.lastName || ""}`.trim()
          } else if (organizer.name) {
            organizerName = organizer.name
          } else if (organizer.email) {
            organizerName = organizer.email.split("@")[0]
          }
        }
      } catch (error) {
        console.error("Error fetching organizer:", error)
      }
    }

    // Format dates and times
    const formattedDate = formatEventDate(event.date)
    const formattedEndDate = event.endDate ? formatEventDate(event.endDate) : null

    let formattedTime = "Time TBA"
    if (event.startTime) {
      formattedTime = formatEventTime(event.startTime)
      if (event.endTime) {
        formattedTime += ` - ${formatEventTime(event.endTime)}`
      }
    }

    // Prepare image URL
    const imageUrl = event.image || event.coverImageUrl || "/vibrant-tech-event.png"

    return (
      <div className="container mx-auto py-12 px-4 md:px-6">
        <div className="mb-6">
          <Link href="/events" className="text-primary hover:underline flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Back to Events
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Image */}
            <div className="relative aspect-video overflow-hidden rounded-lg shadow-md bg-gray-100">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src={imageUrl || "/placeholder.svg"}
                  alt={event.title || "Event"}
                  fill
                  className="object-cover"
                  priority
                  unoptimized={imageUrl.startsWith("http")}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/vibrant-tech-event.png"
                  }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                />
              </div>
            </div>

            {/* Event Details */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title || "Untitled Event"}</h1>

              {event.category && <Badge className="mb-4 bg-primary text-white">{event.category}</Badge>}

              <div className="prose max-w-none mt-6">
                {event.description ? (
                  typeof event.description === "string" ? (
                    <div dangerouslySetInnerHTML={{ __html: event.description }} />
                  ) : (
                    <p>Event description available at the venue.</p>
                  )
                ) : (
                  <p>No description available.</p>
                )}
              </div>
            </div>

            {/* Tags */}
            {event.tags && Array.isArray(event.tags) && event.tags.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Info Card */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold mb-4">Event Details</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p>{formattedDate}</p>
                      {formattedEndDate && <p className="text-sm text-muted-foreground">Ends: {formattedEndDate}</p>}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Time</p>
                      <p>{formattedTime}</p>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-start gap-3">
                      <MapPinIcon className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p>{event.location}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Organizer</p>
                      <p>{organizerName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Ticket className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Price</p>
                      <p>{event.price === 0 || !event.price ? "Free" : `$${event.price}`}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href={`/events/${event.slug || event._id}/register`}>Register Now</Link>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href={`/events/${event.slug || event._id}/volunteer`}>Volunteer</Link>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href={`/events/${event.slug || event._id}/speaker`}>Apply as Speaker</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error rendering event:", error)
    return <EventError />
  }
}

// Main page component with error boundary
export default async function EventPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<EventSkeleton />}>
      {/* @ts-ignore */}
      <EventContent id={params.id} />
    </Suspense>
  )
}
