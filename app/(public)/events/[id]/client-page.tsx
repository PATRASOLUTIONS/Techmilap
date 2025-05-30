"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { CalendarIcon, MapPinIcon, Clock, Users, Tag, Ticket } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Fallback event data
const fallbackEvent = {
  title: "Tech Conference 2023",
  description:
    "<p>Join us for an exciting tech conference featuring the latest innovations and networking opportunities with industry leaders.</p><p>This event will include workshops, panel discussions, and hands-on demonstrations of cutting-edge technologies.</p>",
  date: "2023-12-15",
  location: "Tech Convention Center",
  image: "/vibrant-tech-event.png",
  category: "Technology",
  price: 0,
  tags: ["tech", "innovation", "networking"],
  organizerName: "Tech Community Group",
}

// Helper function to safely format dates
function formatEventDate(dateString) {
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

export default function ClientEventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState(fallbackEvent)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchEvent() {
      try {
        setLoading(true)
        const response = await fetch(`/api/events/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data && data.title) {
            setEvent(data)
          }
        }
      } catch (error) {
        console.error("Error fetching event:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [params.id])

  // Format date
  const formattedDate = formatEventDate(event.date)

  // Image URL
  const imageUrl = event.image || "/vibrant-tech-event.png"

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
          <div className="relative aspect-video overflow-hidden rounded-lg shadow-md bg-gray-100">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={event.title}
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
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{loading ? "Loading..." : event.title}</h1>

            {event.category && <Badge className="mb-4 bg-primary text-white">{event.category}</Badge>}

            <div className="prose max-w-none mt-6">
              {loading ? (
                <p>Loading event details...</p>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: event.description }} />
              )}
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
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p>10:00 AM - 5:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p>{event.location}</p>
                  </div>
                </div>

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
            <Button asChild className="w-full">
              <Link href={`/events/${params.id}/register`}>Register Now</Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href={`/events/${params.id}/volunteer`}>Volunteer</Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href={`/events/${params.id}/speaker`}>Apply as Speaker</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
