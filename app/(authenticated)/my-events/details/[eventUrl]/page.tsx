import { getServerSession } from "next-auth/next"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Calendar, Clock, MapPin, Users } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { EventRegisterButton } from "@/components/events/event-register-button"
import mongoose from "mongoose"

export default async function EventDetailPage({ params }: { params: { eventUrl: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  await connectToDatabase()

  // Try to find the event by slug first
  let event = await Event.findOne({ slug: params.eventUrl })
    .populate("organizer", "firstName lastName email")
    .populate("attendees", "firstName lastName")

  // If not found by slug, check if the eventUrl is a valid ObjectId and try to find by ID
  if (!event && mongoose.Types.ObjectId.isValid(params.eventUrl)) {
    event = await Event.findById(params.eventUrl)
      .populate("organizer", "firstName lastName email")
      .populate("attendees", "firstName lastName")
  }

  if (!event || event.status !== "published") {
    return notFound()
  }

  const isRegistered = event.attendees.some((attendee: any) => attendee._id.toString() === session.user.id)

  const isAtCapacity = event.attendees.length >= event.capacity

  // Check if forms are published
  const hasAttendeeForm = true // Attendee registration is always available
  const hasVolunteerForm = event.volunteerForm?.status === "published"
  const hasSpeakerForm = event.speakerForm?.status === "published"

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          <p className="text-muted-foreground">
            Organized by {event.organizer.firstName} {event.organizer.lastName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {event.category}
          </Badge>
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
            <Image src={event.image || "/community-celebration.png"} alt={event.title} fill className="object-cover" />
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
                    {event.attendees.length} / {event.capacity}
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
                  <span className="font-medium text-primary">
                    {event.organizer.firstName[0]}
                    {event.organizer.lastName[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    {event.organizer.firstName} {event.organizer.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{event.organizer.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
