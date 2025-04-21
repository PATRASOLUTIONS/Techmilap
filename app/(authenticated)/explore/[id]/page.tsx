import { notFound } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import Event from "@/models/Event"
import Image from "next/image"
import { formatDate } from "@/lib/utils"
import { Calendar, Clock, MapPin, Users, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { headers } from "next/headers"

export default async function ExploreEventPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return notFound()
  }

  const eventId = params.id

  if (!eventId) {
    return notFound()
  }

  try {
    await connectToDatabase()

    let event = null

    // Try to find by ID first if it looks like an ObjectId
    if (mongoose.isValidObjectId(eventId)) {
      event = await Event.findOne({
        _id: eventId,
        status: { $in: ["published", "active"] }, // Only show published or active events
      })
        .populate("organizer", "firstName lastName email")
        .lean()
    }

    // If not found by ID or the ID is not a valid ObjectId, try to find by slug
    if (!event) {
      event = await Event.findOne({
        slug: eventId,
        status: { $in: ["published", "active"] }, // Only show published or active events
      })
        .populate("organizer", "firstName lastName email")
        .lean()
    }

    if (!event) {
      return notFound()
    }

    // Ensure organizer exists with fallback values
    if (!event.organizer) {
      event.organizer = {
        firstName: "Event",
        lastName: "Organizer",
        email: "contact@example.com",
      }
    }

    // Ensure all required fields have fallback values
    const safeEvent = {
      _id: event._id,
      title: event.title || "Untitled Event",
      description: event.description || "No description provided.",
      location: event.location || "Location to be announced",
      capacity: event.capacity || 0,
      price: event.price || 0,
      category: event.category || "Uncategorized",
      tags: Array.isArray(event.tags) ? event.tags : [],
      attendees: Array.isArray(event.attendees) ? event.attendees : [],
      date: event.date || new Date(),
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      status: event.status || "draft",
      image: event.image || "",
      organizer: event.organizer,
      customQuestions: event.customQuestions || { attendee: [], volunteer: [] },
    }

    // Check which forms are published by fetching form status
    const formStatusResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${event._id}/forms/status`, {
      headers: {
        Cookie: headers().get("cookie") || "",
      },
      cache: "no-store",
    })

    let hasAttendeeForm = false
    let hasVolunteerForm = false
    let hasSpeakerForm = false

    if (formStatusResponse.ok) {
      const formStatus = await formStatusResponse.json()
      hasAttendeeForm = formStatus.attendeeForm?.status === "published"
      hasVolunteerForm = formStatus.volunteerForm?.status === "published"
      hasSpeakerForm = formStatus.speakerForm?.status === "published"
    } else {
      // Fallback to checking event object directly if API fails
      hasAttendeeForm = event.attendeeForm?.status === "published"
      hasVolunteerForm = event.volunteerForm?.status === "published"
      hasSpeakerForm = event.speakerForm?.status === "published"
    }

    const isAtCapacity = safeEvent.attendees.length >= safeEvent.capacity

    // Determine the image URL with proper fallback
    const imageUrl = safeEvent.image && safeEvent.image !== "" ? safeEvent.image : "/community-celebration.png"

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/explore">
              <ArrowLeft className="h-4 w-4" />
              Back to Explore
            </Link>
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="relative h-64 md:h-80">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={safeEvent.title}
              fill
              className="object-cover"
              priority
              onError={(e) => {
                // @ts-ignore - fallback to default image
                e.target.src = "/community-celebration.png"
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
              <Badge className="mb-2 self-start">{safeEvent.category}</Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{safeEvent.title}</h1>
              <div className="flex items-center text-white/90">
                <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold mr-2">
                  {safeEvent.organizer.firstName?.[0] || "?"}
                </div>
                <span>
                  {safeEvent.organizer.firstName} {safeEvent.organizer.lastName}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="prose max-w-none">
                  <h2 className="text-2xl font-bold mb-4">About this event</h2>
                  <p>{safeEvent.description}</p>
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Event Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 mr-3 mt-0.5 text-blue-600" />
                      <div>
                        <p className="font-medium">Date</p>
                        <p>{safeEvent.date ? formatDate(safeEvent.date) : "Date to be announced"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 mr-3 mt-0.5 text-blue-600" />
                      <div>
                        <p className="font-medium">Time</p>
                        <p>
                          {safeEvent.startTime || "Time to be announced"}
                          {safeEvent.endTime ? ` - ${safeEvent.endTime}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 mr-3 mt-0.5 text-blue-600" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p>{safeEvent.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Users className="h-5 w-5 mr-3 mt-0.5 text-blue-600" />
                      <div>
                        <p className="font-medium">Capacity</p>
                        <p>
                          {safeEvent.attendees.length} / {safeEvent.capacity || "Unlimited"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-2xl font-bold mb-2">
                    {safeEvent.price > 0 ? `$${safeEvent.price.toFixed(2)}` : "Free"}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {safeEvent.tags.length > 0 && <>{safeEvent.tags.join(", ")}</>}
                  </p>

                  <div className="space-y-3">
                    {hasAttendeeForm && !isAtCapacity && (
                      <Button asChild className="w-full">
                        <Link href={`/public-events/${event._id}/register`}>Register as Attendee</Link>
                      </Button>
                    )}
                    {hasVolunteerForm && (
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/public-events/${event._id}/volunteer`}>Apply as Volunteer</Link>
                      </Button>
                    )}
                    {hasSpeakerForm && (
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/public-events/${event._id}/speaker`}>Apply as Speaker</Link>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-2">Contact Organizer</h3>
                  <p className="text-sm">{safeEvent.organizer.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in explore event page:", error)
    return notFound()
  }
}
