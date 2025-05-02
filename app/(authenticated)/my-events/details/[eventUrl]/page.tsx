import { getServerSession } from "next-auth/next"
import { notFound, redirect } from "next/navigation"
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

export default async function EventDetailPage({ params }: { params: { eventUrl: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return redirect("/login")
    }

    await connectToDatabase()

    // Validate eventUrl parameter
    if (!params.eventUrl) {
      return notFound()
    }

    // Try to find the event by slug first
    let event = null
    try {
      event = await Event.findOne({ slug: params.eventUrl })
        .populate("organizer", "firstName lastName email")
        .populate("attendees", "firstName lastName")
        .lean()
    } catch (error) {
      console.error("Error finding event by slug:", error)
    }

    // If not found by slug, check if the eventUrl is a valid ObjectId and try to find by ID
    if (!event && mongoose.Types.ObjectId.isValid(params.eventUrl)) {
      try {
        event = await Event.findById(params.eventUrl)
          .populate("organizer", "firstName lastName email")
          .populate("attendees", "firstName lastName")
          .lean()
      } catch (error) {
        console.error("Error finding event by ID:", error)
      }
    }

    if (!event || event.status !== "published") {
      return notFound()
    }

    // Safely extract organizer information
    const organizer = event.organizer || {}
    const organizerName =
      organizer.firstName && organizer.lastName
        ? `${organizer.firstName} ${organizer.lastName}`.trim()
        : "Unknown Organizer"
    const organizerEmail = organizer.email || "No email provided"
    const organizerInitials =
      organizer.firstName && organizer.lastName ? `${organizer.firstName[0]}${organizer.lastName[0]}` : "?"

    // Safely check if user is registered
    const attendees = Array.isArray(event.attendees) ? event.attendees : []
    const isRegistered = attendees.some((attendee) => {
      if (!attendee) return false
      const attendeeId = attendee._id ? attendee._id.toString() : null
      const userId = attendee.userId ? attendee.userId.toString() : null
      return attendeeId === session.user.id || userId === session.user.id
    })

    // Check if user has submitted forms for this event
    let userSubmissions = []
    try {
      userSubmissions = await FormSubmission.find({
        eventId: event._id,
        $or: [{ userId: session.user.id }, { userEmail: session.user.email }],
      }).lean()
    } catch (error) {
      console.error("Error fetching user submissions:", error)
    }

    // Determine user's role in this event
    let userRole = "visitor"

    // Check if user is organizer
    if (organizer._id && organizer._id.toString() === session.user.id) {
      userRole = "organizer"
    } else if (isRegistered) {
      userRole = "attendee"
    }

    // Check form submissions for other roles
    if (Array.isArray(userSubmissions)) {
      for (const submission of userSubmissions) {
        if (!submission) continue
        if (submission.formType === "speaker") {
          userRole = "speaker"
          break
        } else if (submission.formType === "volunteer" && userRole !== "speaker") {
          userRole = "volunteer"
        } else if (submission.formType === "attendee" && userRole === "visitor") {
          userRole = "attendee"
        }
      }
    }

    // Safely check capacity
    const attendeeCount = Array.isArray(event.attendees) ? event.attendees.length : 0
    const capacity = typeof event.capacity === "number" ? event.capacity : 0
    const isAtCapacity = attendeeCount >= capacity

    // Check if forms are published
    const hasAttendeeForm = true // Attendee registration is always available
    const hasVolunteerForm = event.volunteerForm && event.volunteerForm.status === "published"
    const hasSpeakerForm = event.speakerForm && event.speakerForm.status === "published"

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{event.title || "Event"}</h1>
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
            <EventRegisterButton
              eventId={event._id.toString()}
              isRegistered={isRegistered}
              isAtCapacity={isAtCapacity}
              hasAttendeeForm={hasAttendeeForm}
              hasVolunteerForm={hasVolunteerForm}
              hasSpeakerForm={hasSpeakerForm}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <Image
                src={event.image || "/community-celebration.png"}
                alt={event.title || "Event"}
                fill
                className="object-cover"
              />
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
                    <p>{event.date ? formatDate(event.date) : "Date not specified"}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Time</h3>
                    <p>
                      {event.date
                        ? new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "Time not specified"}
                    </p>
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
    console.error("Unhandled error in EventDetailPage:", error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">We encountered an error while loading this event.</p>
        <a href="/my-events" className="text-primary hover:underline">
          Return to My Events
        </a>
      </div>
    )
  }
}
