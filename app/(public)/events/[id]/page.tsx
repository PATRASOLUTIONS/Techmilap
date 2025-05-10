import { notFound } from "next/navigation"
import Image from "next/image"
import { format, parseISO } from "date-fns"
import { CalendarIcon, MapPinIcon, Clock, Users, Tag, Ticket } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import User from "@/models/User"
import Link from "next/link"

// Helper function to safely format dates
function safeFormatDate(dateString, formatString) {
  if (!dateString) return "Date TBA"

  try {
    // Try to parse the date string
    let date
    if (typeof dateString === "string") {
      // Handle ISO string
      date = parseISO(dateString)
    } else {
      // Handle Date object
      date = new Date(dateString)
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.log("Invalid date:", dateString)
      return "Date TBA"
    }

    return format(date, formatString)
  } catch (error) {
    console.error("Error formatting date:", error, dateString)
    return "Date TBA"
  }
}

async function getEvent(id: string) {
  try {
    await connectToDatabase()

    // Try to find by ID or slug
    let event = null

    // First try to find by exact ID match
    try {
      event = await Event.findById(id).lean()
    } catch (error) {
      console.log("Not a valid ObjectId, trying slug lookup")
    }

    // If not found by ID, try to find by slug (case insensitive)
    if (!event) {
      event = await Event.findOne({
        $or: [{ slug: { $regex: new RegExp(`^${id}$`, "i") } }, { slug: id }],
      }).lean()
    }

    // If still not found, try a more flexible search
    if (!event) {
      event = await Event.findOne({
        $or: [{ title: { $regex: id, $options: "i" } }, { slug: { $regex: id, $options: "i" } }],
      }).lean()
    }

    if (!event) {
      return null
    }

    // Fetch organizer info if available
    let organizerInfo = null
    if (event.organizer) {
      try {
        organizerInfo = await User.findById(event.organizer, { name: 1, email: 1 }).lean()
      } catch (error) {
        console.error("Error fetching organizer:", error)
      }
    }

    return {
      ...event,
      organizerInfo,
    }
  } catch (error) {
    console.error("Error fetching event:", error)
    return null
  }
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id)

  if (!event) {
    notFound()
  }

  // Log the event date for debugging
  console.log("Event date from DB:", event.date)
  console.log("Event startTime:", event.startTime)
  console.log("Event endTime:", event.endTime)

  // Format dates
  let formattedDate = "Date TBA"
  let formattedTime = "Time TBA"
  let formattedEndDate = null

  // Format the event date
  if (event.date) {
    formattedDate = safeFormatDate(event.date, "EEEE, MMMM d, yyyy")
  }

  // Format the end date if available
  if (event.endDate) {
    formattedEndDate = safeFormatDate(event.endDate, "EEEE, MMMM d, yyyy")
  }

  // Format the time
  if (event.startTime) {
    try {
      // Handle different time formats
      const timeStr = event.startTime

      // If it's just a time string like "14:30"
      if (timeStr.length <= 5) {
        const [hours, minutes] = timeStr.split(":").map(Number)
        const period = hours >= 12 ? "PM" : "AM"
        const hour12 = hours % 12 || 12
        formattedTime = `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`
      } else {
        // If it's a full datetime string
        formattedTime = safeFormatDate(timeStr, "h:mm a")
      }

      // Add end time if available
      if (event.endTime) {
        const endTimeStr = event.endTime
        let formattedEndTime

        if (endTimeStr.length <= 5) {
          const [hours, minutes] = endTimeStr.split(":").map(Number)
          const period = hours >= 12 ? "PM" : "AM"
          const hour12 = hours % 12 || 12
          formattedEndTime = `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`
        } else {
          formattedEndTime = safeFormatDate(endTimeStr, "h:mm a")
        }

        formattedTime = `${formattedTime} - ${formattedEndTime}`
      }
    } catch (error) {
      console.error("Error formatting time:", error)
      formattedTime = "Time TBA"
    }
  }

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
          <div className="relative aspect-video overflow-hidden rounded-lg shadow-md">
            <Image
              src={event.image || "/placeholder.svg?height=600&width=1200&query=tech+event"}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Event Details */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>

            {event.category && <Badge className="mb-4 bg-primary text-white">{event.category}</Badge>}

            <div className="prose max-w-none mt-6">
              <div dangerouslySetInnerHTML={{ __html: event.description || "No description available." }} />
            </div>
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
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

                {event.organizerInfo && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Organizer</p>
                      <p>{event.organizerInfo.name}</p>
                    </div>
                  </div>
                )}

                {event.price !== undefined && (
                  <div className="flex items-start gap-3">
                    <Ticket className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Price</p>
                      <p>{event.price === 0 ? "Free" : `$${event.price}`}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href={`/events/${event.slug || event._id}/register`}>Register Now</Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href={`/events/${event.slug || event._id}/volunteer`}>Volunteer</Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href={`/events/${event.slug || event._id}/speaker`}>Apply as Speaker</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
