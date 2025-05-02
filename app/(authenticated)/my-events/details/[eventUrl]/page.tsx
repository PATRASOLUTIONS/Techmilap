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
      // Continue execution to handle the null event case below
    }

    if (!event) {
      return notFound()
    }

    // Ensure we have attendees array
    const attendees = event.attendees || []

    // Check if user is registered
    const isRegistered = attendees.some((attendee) => {
      if (!attendee) return false
      const attendeeId = attendee._id ? attendee._id.toString() : null
      const userId = attendee.userId ? attendee.userId.toString() : null
      return attendeeId === session.user.id || userId === session.user.id
    })

    // Check if user has submitted forms for this event
    const userSubmissions = await FormSubmission.find({
      eventId: event._id,
      $or: [{ userId: session.user.id }, { userEmail: session.user.email }],
    }).lean()

    // Determine user's role in this event
    let userRole = "visitor"

    // Check if user is organizer
    const organizerId = event.organizer?._id?.toString() || event.organizer?.toString()
    if (organizerId === session.user.id) {
      userRole = "organizer"
    } else if (isRegistered) {
      userRole = "attendee"
    }

    // Check form submissions for other roles
    for (const submission of userSubmissions || []) {
      if (submission.formType === "speaker") {
        userRole = "speaker"
        break
      } else if (submission.formType === "volunteer" && userRole !== "speaker") {
        userRole = "volunteer"
      } else if (submission.formType === "attendee" && userRole === "visitor") {
        userRole = "attendee"
      }
    }

    // Get organizer details
    const organizer = event.organizer || {}
    const organizerName =
      organizer.firstName && organizer.lastName ? `${organizer.firstName} ${organizer.lastName}` : "Event Organizer"
    const organizerEmail = organizer.email || "No email provided"
    const organizerInitials =
      organizer.firstName && organizer.lastName ? `${organizer.firstName[0]}${organizer.lastName[0]}` : "EO"

    // Check capacity
    const attendeeCount = attendees.length || 0
    const capacity = event.capacity || 100
    const isAtCapacity = attendeeCount >= capacity

    // Check if forms are published
    const hasAttendeeForm = true // Attendee registration is always available
    const hasVolunteerForm = event.volunteerForm?.status === "published"
    const hasSpeakerForm = event.speakerForm?.status === "published"

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
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
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>About this event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{event.description}</p>
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
                    <p>{formatDate(event.date)}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Time</h3>
                    <p>{new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Location</h3>
                    <p>{event.location}</p>
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
    return notFound()
  }
}
