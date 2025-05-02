import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Image from "next/image"
import { Calendar, Clock, MapPin, Users } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import FormSubmission from "@/models/FormSubmission"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { EventRegisterButton } from "@/components/events/event-register-button"
import mongoose from "mongoose"

// Create a fallback component for error handling
function ErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
      <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist or has been removed.</p>
      <a href="/my-events" className="text-primary hover:underline">
        Return to My Events
      </a>
    </div>
  )
}

export default async function EventDetailPage({ params }: { params: { eventUrl: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return redirect("/login")
    }

    await connectToDatabase()

    // Try to find the event by slug first
    let event = null

    try {
      if (mongoose.Types.ObjectId.isValid(params.eventUrl)) {
        // If it's a valid ObjectId, try to find by ID first
        event = await Event.findById(params.eventUrl).populate("organizer", "firstName lastName email").lean()
      } else {
        // Otherwise try by slug
        event = await Event.findOne({ slug: params.eventUrl }).populate("organizer", "firstName lastName email").lean()
      }
    } catch (error) {
      console.error("Error finding event:", error)
      return <ErrorFallback />
    }

    if (!event) {
      return <ErrorFallback />
    }

    // Ensure we have attendees array and it's properly formatted
    const attendees = Array.isArray(event.attendees) ? event.attendees : []

    // Check if user is registered - with safer checks
    const isRegistered = attendees.some((attendee) => {
      if (!attendee) return false

      // Handle different possible formats of attendee data
      let attendeeId = null
      let userId = null

      if (typeof attendee === "object") {
        attendeeId = attendee._id ? attendee._id.toString() : null
        userId = attendee.userId ? attendee.userId.toString() : null
      } else if (typeof attendee === "string") {
        attendeeId = attendee
      }

      return attendeeId === session.user.id || userId === session.user.id
    })

    // Check if user has submitted forms for this event - with safer checks
    let userSubmissions = []
    try {
      userSubmissions = await FormSubmission.find({
        eventId: event._id,
        $or: [{ userId: session.user.id }, { userEmail: session.user.email }],
      }).lean()
    } catch (error) {
      console.error("Error fetching user submissions:", error)
      userSubmissions = []
    }

    // Determine user's role in this event
    let userRole = "visitor"

    // Check if user is organizer - with safer checks
    let organizerId = null
    if (event.organizer) {
      if (typeof event.organizer === "object" && event.organizer._id) {
        organizerId = event.organizer._id.toString()
      } else if (typeof event.organizer === "string") {
        organizerId = event.organizer
      }
    }

    if (organizerId === session.user.id) {
      userRole = "organizer"
    } else if (isRegistered) {
      userRole = "attendee"
    }

    // Check form submissions for other roles - with safer checks
    if (Array.isArray(userSubmissions)) {
      for (const submission of userSubmissions) {
        if (submission && submission.formType === "speaker") {
          userRole = "speaker"
          break
        } else if (submission && submission.formType === "volunteer" && userRole !== "speaker") {
          userRole = "volunteer"
        } else if (submission && submission.formType === "attendee" && userRole === "visitor") {
          userRole = "attendee"
        }
      }
    }

    // Get organizer details - with safer checks
    const organizer = event.organizer || {}
    let organizerName = "Event Organizer"
    let organizerEmail = "No email provided"
    let organizerInitials = "EO"

    if (typeof organizer === "object") {
      if (organizer.firstName && organizer.lastName) {
        organizerName = `${organizer.firstName} ${organizer.lastName}`
        organizerInitials = `${organizer.firstName[0]}${organizer.lastName[0]}`
      }
      if (organizer.email) {
        organizerEmail = organizer.email
      }
    }

    // Check capacity - with safer checks
    const attendeeCount = Array.isArray(attendees) ? attendees.length : 0
    const capacity = typeof event.capacity === "number" ? event.capacity : 100
    const isAtCapacity = attendeeCount >= capacity

    // Check if forms are published - with safer checks
    const hasAttendeeForm = true // Attendee registration is always available
    const hasVolunteerForm = event.volunteerForm && event.volunteerForm.status === "published"
    const hasSpeakerForm = event.speakerForm && event.speakerForm.status === "published"

    // Ensure event date is valid
    const eventDate = event.date ? new Date(event.date) : new Date()
    const isValidDate = !isNaN(eventDate.getTime())

    // Format date safely
    const formattedDate = isValidDate ? formatDate(eventDate) : "Date not available"

    // Format time safely
    let formattedTime = "Time not available"
    if (isValidDate) {
      try {
        formattedTime = eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      } catch (error) {
        console.error("Error formatting time:", error)
      }
    }

    // Ensure event has an ID for the register button
    const eventId = event._id ? event._id.toString() : ""

    return (
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
            {userRole !== "visitor" && (
              <Badge
                className={`
                ${userRole === "organizer" ? "bg-primary/20 text-primary border-primary/30" : ""}
                ${userRole === "speaker" ? "bg-secondary/20 text-secondary border-secondary/30" : ""}
                ${userRole === "volunteer" ? "bg-amber-500/20 text-amber-600 border-amber-500/30" : ""}
                ${userRole === "attendee" ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : ""}
              `}
              >
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
            )}
            {eventId && (
              <EventRegisterButton
                eventId={eventId}
                isRegistered={isRegistered}
                isAtCapacity={isAtCapacity}
                hasAttendeeForm={hasAttendeeForm}
                hasVolunteerForm={hasVolunteerForm}
                hasSpeakerForm={hasSpeakerForm}
              />
            )}
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
                    <p>{event.location || "Location not specified"}</p>
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
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Unexpected error in EventDetailPage:", error)
    return <ErrorFallback />
  }
}
