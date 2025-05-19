import Link from "next/link"
import Image from "next/image"
import { CalendarIcon, MapPinIcon, Clock, Users, Tag, Ticket } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import mongoose from "mongoose"

// Fallback event data
const fallbackEvent = {
  title: "Event Details",
  description: "<p>Event details will be available soon.</p>",
  date: new Date().toISOString(),
  location: "To be announced",
  image: "/vibrant-tech-event.png",
  category: "Event",
  price: 0,
  tags: ["event"],
  organizerName: "Event Organizer",
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
    return "Time TBA"
  } catch (error) {
    return "Time TBA"
  }
}

export default async function EventPage({ params }: { params: { id: string } }) {
  // Initialize with fallback data
  let event = { ...fallbackEvent }
  let organizerName = "Event Organizer"

  try {
    // Import mongoose dynamically to avoid issues
    const MONGODB_URI = process.env.MONGODB_URI

    if (MONGODB_URI) {
      // Connect to MongoDB directly
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(MONGODB_URI, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        })
      }

      // Define a simple schema for Event
      const EventSchema = new mongoose.Schema(
        {
          title: String,
          description: String,
          date: Date,
          endDate: Date,
          startTime: String,
          endTime: String,
          location: String,
          image: String,
          coverImageUrl: String,
          category: String,
          price: Number,
          tags: [String],
          slug: String,
          organizer: mongoose.Schema.Types.ObjectId,
        },
        { strict: false },
      )

      // Define a simple schema for User
      const UserSchema = new mongoose.Schema(
        {
          firstName: String,
          lastName: String,
          email: String,
          name: String,
        },
        { strict: false },
      )

      // Get or create models
      const Event = mongoose.models.Event || mongoose.model("Event", EventSchema)
      const User = mongoose.models.User || mongoose.model("User", UserSchema)

      // Try to find event by ID or slug
      let eventData = null

      if (mongoose.isValidObjectId(params.id)) {
        eventData = await Event.findById(params.id).lean()
      }

      if (!eventData) {
        eventData = await Event.findOne({ slug: params.id }).lean()
      }

      // If event found, update our event object
      if (eventData) {
        event = {
          ...event,
          ...eventData,
          title: eventData.title || fallbackEvent.title,
          description: eventData.description || fallbackEvent.description,
          date: eventData.date || fallbackEvent.date,
          location: eventData.location || fallbackEvent.location,
          image: eventData.image || eventData.coverImageUrl || fallbackEvent.image,
          category: eventData.category || fallbackEvent.category,
          price: eventData.price || fallbackEvent.price,
          tags: Array.isArray(eventData.tags) ? eventData.tags : fallbackEvent.tags,
        }

        // Try to get organizer info
        if (eventData.organizer && mongoose.isValidObjectId(eventData.organizer)) {
          try {
            const organizer = await User.findById(eventData.organizer).lean()
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
      }
    }
  } catch (error) {
    console.error("Error fetching event:", error)
    // Continue with fallback data
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
  const imageUrl = event.image || "/vibrant-tech-event.png"

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

          {/* Event Details */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title || "Event Details"}</h1>

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

                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p>{event.location}</p>
                  </div>
                </div>

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
              <Link href={`/events/${params.id}/register`}>Register Now</Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href={`/events/${params.id}/volunteer`}>Volunteer</Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href={`/events/${params.id}/speaker`}>Apply as Speaker</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
