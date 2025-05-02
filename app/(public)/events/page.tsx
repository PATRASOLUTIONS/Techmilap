import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import User from "@/models/User"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, Clock, Users, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"

// This function directly queries the database without using API routes
async function getEventsDirectly() {
  try {
    console.log("Connecting to database...")
    await connectToDatabase()
    console.log("Connected to database successfully")

    console.log("Fetching events directly from database...")
    const events = await Event.find({ isActive: true }).lean()
    console.log(`Found ${events.length} events in database`)

    // Get unique organizer IDs
    const organizerIds = events
      .map((event) => event.organizer)
      .filter(Boolean)
      .map((id) => id.toString())

    // Fetch organizers
    let organizers = []
    if (organizerIds.length > 0) {
      console.log("Fetching organizer information...")
      organizers = await User.find({ _id: { $in: organizerIds } }, { name: 1, email: 1 }).lean()
      console.log(`Found ${organizers.length} organizers`)
    }

    // Create organizer map for quick lookup
    const organizerMap = {}
    for (const organizer of organizers) {
      organizerMap[organizer._id.toString()] = organizer
    }

    // Add organizer info to events
    const processedEvents = events.map((event) => {
      const eventWithOrganizer = { ...event }

      if (event.organizer) {
        const organizerId = event.organizer.toString()
        eventWithOrganizer.organizerInfo = organizerMap[organizerId] || null
      }

      return eventWithOrganizer
    })

    return { events: processedEvents, error: null }
  } catch (error) {
    console.error("Error fetching events directly:", error)
    return {
      events: [],
      error: error instanceof Error ? error.message : "Unknown error occurred while fetching events",
    }
  }
}

export default async function EventsPage() {
  console.log("Rendering EventsPage component")
  const { events, error } = await getEventsDirectly()

  return (
    <div className="pt-16">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">All Events</h1>
          <p className="text-muted-foreground mt-2">Browse all our exciting events</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Events</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id.toString()} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error ? "Failed to load events." : "No events found."}</p>
            {!error && <p className="mt-2">Check back soon for new events!</p>}
          </div>
        )}
      </div>
    </div>
  )
}

// Simple event card component defined directly in the page to avoid import issues
function EventCard({ event }) {
  // Handle potential missing or invalid date
  let formattedDate = "Date TBA"
  let formattedTime = "Time TBA"

  try {
    if (event.date) {
      const eventDate = new Date(event.date)
      if (!isNaN(eventDate.getTime())) {
        formattedDate = format(eventDate, "EEEE, MMMM d, yyyy")
        formattedTime = format(eventDate, "h:mm a")
      }
    }
  } catch (error) {
    console.error(`Error formatting date for event ${event._id}:`, error)
  }

  const eventId = event.slug || event._id

  return (
    <Link href={`/events/${eventId}`} className="group">
      <Card className="overflow-hidden border-none shadow-md transition-all duration-200 hover:shadow-lg h-full">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={event.image || "/placeholder.svg?height=400&width=600&query=tech+event"}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {event.category && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-primary/90 hover:bg-primary text-white">{event.category}</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-5">
          <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          <div className="space-y-2 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formattedTime}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
            {event.organizerInfo?.name && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="line-clamp-1">By {event.organizerInfo.name}</span>
              </div>
            )}
          </div>

          {event.price !== undefined && (
            <div className="mt-4">
              <Badge variant="outline" className="text-primary border-primary">
                {event.price === 0 ? "Free" : `$${event.price}`}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
