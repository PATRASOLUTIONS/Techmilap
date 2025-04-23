import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { redirect } from "next/navigation"
import { CalendarIcon, MapPinIcon, UsersIcon, ClockIcon } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { EventUserRegistrationDialog } from "@/components/events/event-user-registration-dialog"
import mongoose from "mongoose"
import ReactMarkdown from "react-markdown"

// Import models
const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
const User = mongoose.models.User || mongoose.model("User", require("@/models/User").default.schema)

export default async function EventDetailsPage({ params }: { params: { eventUrl: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  await connectToDatabase()

  // Check if the ID is a valid MongoDB ObjectId
  const isValidObjectId = mongoose.isValidObjectId(params.eventUrl)
  let event = null

  if (isValidObjectId) {
    // If it's a valid ObjectId, try to find by ID first
    event = await Event.findById(params.eventUrl).populate("organizer", "firstName lastName email")
  }

  // If not found by ID or not a valid ObjectId, try to find by slug
  if (!event && !isValidObjectId) {
    event = await Event.findOne({ slug: params.eventUrl }).populate("organizer", "firstName lastName email")
  }

  if (!event) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Event Not Found</h2>
          <p className="text-red-600 mb-4">The event you're looking for could not be found.</p>
          <Button asChild variant="outline">
            <Link href="/my-events">Back to My Events</Link>
          </Button>
        </div>
      </div>
    )
  }

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

  // Get organizer name
  const organizerName = event.organizer
    ? `${event.organizer.firstName} ${event.organizer.lastName}`
    : "Unknown Organizer"

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/my-events" className="text-primary hover:underline flex items-center gap-1">
          <span>← Back to My Events</span>
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
            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              {/* Event Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <span className="font-medium">{eventStatus}</span>
                </div>
              </div>

              {/* Registration Button */}
              <div className="space-y-3">
                <EventUserRegistrationDialog
                  eventId={event._id.toString()}
                  buttonText="Registration Options"
                  className="w-full"
                />

                {session.user.id === event.organizer._id.toString() && (
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/event-dashboard/${event._id}`}>Manage Event</Link>
                  </Button>
                )}
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
                    <ClockIcon className="h-5 w-5 text-primary" />
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
                      <UsersIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Capacity</p>
                      <p className="font-medium">
                        {event.attendees?.length || 0} / {event.capacity} attendees
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Organizer Info */}
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-3">Organized by</p>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <span className="font-medium text-primary">
                      {organizerName
                        .split(" ")
                        .map((name) => name[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{organizerName}</p>
                    <p className="text-sm text-muted-foreground">Event Organizer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Event Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Event Header */}
          <div>
            <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
            <div className="flex flex-wrap gap-2 mb-6">
              {event.tags &&
                event.tags.length > 0 &&
                event.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
            </div>
          </div>

          {/* Event Description */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-4">About This Event</h2>
            <div className="prose max-w-none">
              {event.description ? (
                <ReactMarkdown>{event.description}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground italic">No description available.</p>
              )}
            </div>
          </div>

          {/* Event Schedule (if available) */}
          {event.schedule && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold mb-4">Event Schedule</h2>
              <div className="prose max-w-none">
                <ReactMarkdown>{event.schedule}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Additional Details (if available) */}
          {event.details && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold mb-4">Additional Information</h2>
              <div className="prose max-w-none">
                <ReactMarkdown>{event.details}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
