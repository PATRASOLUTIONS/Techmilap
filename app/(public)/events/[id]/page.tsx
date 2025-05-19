import { notFound } from "next/navigation"
import Image from "next/image"
import { CalendarIcon, MapPinIcon, Clock, Users, Tag, Ticket } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import User from "@/models/User"
import Link from "next/link"
import mongoose from "mongoose"

// Helper function to safely format dates
function formatEventDate(dateString) {
  if (!dateString) return "Date TBA"

  try {
    // Create a new Date object from the date string
    const date = new Date(dateString)

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.log("Invalid date:", dateString)
      return "Date TBA"
    }

    // Format the date using toLocaleDateString without specifying timezone
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error, dateString)
    return "Date TBA"
  }
}

// Helper function to safely format time
function formatEventTime(timeString) {
  if (!timeString) return "Time TBA"

  try {
    // If it's just a time string like "14:30"
    if (typeof timeString === "string" && timeString.length <= 5 && timeString.includes(":")) {
      const [hours, minutes] = timeString.split(":").map(Number)
      const period = hours >= 12 ? "PM" : "AM"
      const hour12 = hours % 12 || 12
      return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`
    }

    // If it's a full datetime string
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
    console.error("Error formatting time:", error, timeString)
    return "Time TBA"
  }
}

async function getEvent(id: string) {
  try {
    await connectToDatabase()

    // Try to find by ID or slug
    let event = null

    // First try to find by exact ID match
    if (mongoose.isValidObjectId(id)) {
      try {
        event = await Event.findById(id).lean()
      } catch (error) {
        console.log("Error finding by ID:", error)
      }
    }

    // If not found by ID, try to find by slug
    if (!event) {
      try {
        event = await Event.findOne({ slug: id }).lean()
      } catch (error) {
        console.log("Error finding by slug:", error)
      }
    }

    if (!event) {
      return null
    }

    // Fetch organizer info if available
    let organizerInfo = null
    if (event.organizer) {
      try {
        organizerInfo = await User.findById(event.organizer).lean()

        // Create a name field from firstName and lastName or use email as fallback
        if (organizerInfo) {
          if (organizerInfo.firstName || organizerInfo.lastName) {
            organizerInfo.name = `${organizerInfo.firstName || ""} ${organizerInfo.lastName || ""}`.trim()
          } else if (organizerInfo.email) {
            organizerInfo.name = organizerInfo.email.split("@")[0]
          } else {
            organizerInfo.name = "Event Organizer"
          }
        }
      } catch (error) {
        console.error("Error fetching organizer:", error)
      }
    }

    // Process image URL
    let imageUrl = "/vibrant-tech-event.png" // Default fallback
    if (event.image) {
      imageUrl = event.image
    } else if (event.coverImageUrl) {
      imageUrl = event.coverImageUrl
    }

    return {
      ...event,
      image: imageUrl,
      organizerInfo: organizerInfo || { name: "Event Organizer" },
    }
  } catch (error) {
    console.error("Error fetching event:", error)
    return null
  }
}

export default async function EventPage({ params }: { params: { id: string } }) {
  try {
    const event = await getEvent(params.id)

    if (!event) {
      notFound()
    }

    // Format dates
    const formattedDate = formatEventDate(event.date)
    const formattedEndDate = event.endDate ? formatEventDate(event.endDate) : null

    // Format time
    let formattedTime = "Time TBA"
    if (event.startTime) {
      formattedTime = formatEventTime(event.startTime)

      if (event.endTime) {
        formattedTime += ` - ${formatEventTime(event.endTime)}`
      }
    }

    // Default image if none is provided
    const imageUrl = event.image || "/vibrant-tech-event.png"
    const fallbackImageUrl = "/vibrant-tech-event.png"

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
            <div className="relative aspect-video overflow-hidden rounded-lg shadow-md">
              <Image
                src={imageUrl || "/placeholder.svg"}
                alt={event.title || "Event"}
                fill
                className="object-cover"
                priority
                unoptimized={imageUrl.startsWith("http")}
                onError={(e) => {
                  // Simple fallback for image errors
                  const target = e.target as HTMLImageElement
                  if (target.src !== fallbackImageUrl) {
                    target.src = fallbackImageUrl
                  }
                }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
              />
            </div>

            {/* Event Details */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>

              {event.category && <Badge className="mb-4 bg-primary text-white">{event.category}</Badge>}

              <div className="prose max-w-none mt-6">
                {event.description ? (
                  <div dangerouslySetInnerHTML={{ __html: event.description }} />
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

                  {event.organizerInfo && (
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Organizer</p>
                        <p>{event.organizerInfo.name}</p>
                      </div>
                    </div>
                  )}

                  {event.price !== undefined && (
                    <div className="flex items-start gap-3">
                      <Ticket className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Price</p>
                        <p>{event.price === 0 ? "Free" : `$${event.price}`}</p>
                      </div>
                    </div>
                  )}
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
    console.error("Error rendering event page:", error)
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
}
