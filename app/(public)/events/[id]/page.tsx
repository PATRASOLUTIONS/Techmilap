"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { CalendarIcon, MapPinIcon, Clock, Users, Tag, Ticket } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

type FormDetails = {
  status: "published" | "draft" | string;
};

type EventType = {
  title: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  image: string;
  category: string;
  price: number;
  organizerName: string;
  tags?: string[];
  startTime?: string;
  endTime?: string;
  attendeeForm: FormDetails;
  volunteerForm: FormDetails;
  speakerForm: FormDetails;
  // Add any other fields you expect
};

const fallbackEvent: EventType = {
  title: "Event Details",
  description:
    "<p>This event will be a gathering of professionals and enthusiasts. Join us for networking, learning, and fun!</p>",
  date: new Date().toISOString(),
  endDate: new Date(Date.now() + 86400000).toISOString(), // 1 day later
  location: "Event Venue",
  image: "/vibrant-tech-event.png",
  category: "General",
  price: 0,
  organizerName: "Event Organizer",
  tags: ["networking", "community"],
  startTime: "09:00",
  endTime: "17:00",
  attendeeForm: { status: "draft" },
  volunteerForm: { status: "draft" },
  speakerForm: { status: "draft" },
}

// Helper function to safely format dates
function formatEventDate(dateString: any) {
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
function formatEventTime(timeString: any) {
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

export default function EventPage({
  params: paramsPromise, // Rename the prop for clarity, it's a Promise
}: {
  params: Promise<{ id: string }>; // Type the incoming prop as a Promise as per Next.js warning
}) {
  const params = use(paramsPromise); // Unwrap the promise using React.use()
  const { id } = params; // Now 'params' is the resolved object { id: string }, destructure id
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // If the authentication status is still loading, do nothing and wait.
    if (status === "loading") {
      return;
    }
    // If the status is determined to be unauthenticated, then redirect.
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const [event, setEvent] = useState<EventType>(fallbackEvent);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isPast, setIsPast] = useState(false)

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${id}/static`)
        if (!response.ok) {
          throw new Error("Failed to fetch event")
        }
        const data = await response.json()
        console.log("Fetched event:", data)
        setEvent(data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching event:", error)
        setError(true)
        setLoading(false)
      }
    }

    fetchEvent()
  }, [id])

  useEffect(() => {
    if (event) {
      const isPast = hasEventPassed(event);
      setIsPast(isPast);
    }
  }, [event]);

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

  // Default image
  const imageUrl = event.image || "/vibrant-tech-event.png"

  // Determine if the event has passed
  const hasEventPassed = (event: any): boolean => {
    const now = new Date();
    const eventDate = event.endDate ? new Date(event.endDate) : new Date(event.date);
    return eventDate < now;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="aspect-video bg-gray-200 rounded-lg"></div>
              <div>
                <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="w-20 h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-200 rounded-lg h-64"></div>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="my-6">
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
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>

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

                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p>{event.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Organizer</p>
                    <p>{event.organizerName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Ticket className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Price</p>
                    <p>{event.price === 0 ? "Free" : `$${event.price}`}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {// This hides the draft forms
              event.attendeeForm?.status === "published" && (
                <Button asChild className="w-full">
                  <Link href={`/events/${id}/register`} className={isPast ? 'disabled-link' : ''}>Register Now</Link>
                </Button>
              )}
            {
              event.volunteerForm?.status === "published" && (
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/events/${id}/volunteer`} className={isPast ? 'disabled-link' : ''}>Volunteer</Link>
                </Button>
              )}
            {
              event.speakerForm?.status === "published" && (
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/events/${id}/speaker`} className={isPast ? 'disabled-link' : ''}>Apply as Speaker</Link>
                </Button>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}
