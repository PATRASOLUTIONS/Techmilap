"use client"

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
  // Ensure we have an authenticated session
  const session = await getServerSession(authOptions)

  if (!session) {
    return redirect("/login?callbackUrl=/my-events")
  }

  try {
    await connectToDatabase()

    // Safely handle the eventUrl parameter
    const eventUrl = params?.eventUrl || ""

    if (!eventUrl) {
      return notFound()
    }

    // Try to find the event by slug first
    let event = null

    try {
      event = await Event.findOne({ slug: eventUrl })
        .populate("organizer", "firstName lastName email")
        .populate("attendees", "firstName lastName")
        .lean()
    } catch (error) {
      console.error("Error finding event by slug:", error)
    }

    // If not found by slug, check if the eventUrl is a valid ObjectId and try to find by ID
    if (!event && mongoose.Types.ObjectId.isValid(eventUrl)) {
      try {
        event = await Event.findById(eventUrl)
          .populate("organizer", "firstName lastName email")
          .populate("attendees", "firstName lastName")
          .lean()
      } catch (error) {
        console.error("Error finding event by ID:", error)
      }
    }

    // If event is still not found, return 404
    if (!event) {
      return notFound()
    }

    // Ensure organizer exists and has required fields
    if (!event.organizer) {
      event.organizer = {
        _id: "unknown",
        firstName: "Unknown",
        lastName: "Organizer",
        email: "unknown@example.com",
      }
    }

    // Ensure attendees array exists
    if (!Array.isArray(event.attendees)) {
      event.attendees = []
    }

    // Check if user is registered as an attendee
    const isRegistered = event.attendees.some((attendee: any) => {
      if (!attendee) return false

      return (
        attendee._id?.toString() === session.user.id ||
        (attendee.userId && attendee.userId.toString() === session.user.id)
      )
    })

    // Check if user has submitted forms for this event
    let userSubmissions = []
    try {
      userSubmissions = await FormSubmission.find({
        eventId: event._id,
        $or: [{ userId: session.user.id }, { userEmail: session.user.email }],
      }).lean()
    } catch (error) {
      console.error("Error finding user submissions:", error)
      userSubmissions = []
    }

    // Determine user's role in this event
    let userRole = "visitor"
    if (event.organizer._id?.toString() === session.user.id) {
      userRole = "organizer"
    } else if (isRegistered) {
      userRole = "attendee"
    }

    // Check form submissions for other roles
    for (const submission of userSubmissions) {
      if (submission.formType === "speaker") {
        userRole = "speaker"
        break
      } else if (submission.formType === "volunteer" && userRole !== "speaker") {
        userRole = "volunteer"
      } else if (submission.formType === "attendee" && userRole === "visitor") {
        userRole = "attendee"
      }
    }

    const isAtCapacity = (event.attendees?.length || 0) >= (event.capacity || 0)

    // Check if forms are published
    const hasAttendeeForm = true // Attendee registration is always available
    const hasVolunteerForm = event.volunteerForm?.status === "published"
    const hasSpeakerForm = event.speakerForm?.status === "published"

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{event.title || "Untitled Event"}</h1>
            <p className="text-muted-foreground">
              Organized by {event.organizer?.firstName || "Unknown"} {event.organizer?.lastName || ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {event.category || "Uncategorized"}
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
                onError={(e) => {
                  // @ts-ignore - fallback to default image
                  e.target.src = "/community-celebration.png"
                }}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>About this event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{event.description || "No description provided."}</p>
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
                    {event.endDate && event.date !== event.endDate && (
                      <p className="text-sm text-muted-foreground">to {formatDate(event.endDate)}</p>
                    )}
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
                    {event.endTime && <p className="text-sm text-muted-foreground">to {event.endTime}</p>}
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
                      {event.attendees?.length || 0} / {event.capacity || "∞"}
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
                      {event.organizer?.firstName?.[0] || "?"}
                      {event.organizer?.lastName?.[0] || ""}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {event.organizer?.firstName || "Unknown"} {event.organizer?.lastName || ""}
                    </p>
                    <p className="text-sm text-muted-foreground">{event.organizer?.email || "No email provided"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in EventDetailPage:", error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">We encountered an error while loading this event.</p>
        <p className="text-sm text-muted-foreground mb-8">
          Error details: {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <div className="flex gap-4">
          <a
            href="/my-events"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Back to My Events
          </a>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }
}
