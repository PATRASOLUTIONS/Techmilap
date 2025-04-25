"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"

interface Event {
  _id: string
  slug?: string
  title: string
  description?: string
  date?: string
  location?: string
  image?: string
  category?: string
  tags?: string[]
  price?: number
  capacity?: number
}

export function PublicEventList({ events = [] }: { events: Event[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => {
        const eventDate = event.date ? new Date(event.date) : null
        const formattedDate = eventDate ? format(eventDate, "EEEE, MMMM d, yyyy") : "Date TBA"
        const formattedTime = eventDate ? format(eventDate, "h:mm a") : "Time TBA"
        const eventId = event.slug || event._id

        return (
          <Link href={`/events/${eventId}`} key={event._id} className="group">
            <Card className="overflow-hidden border-none shadow-md transition-all duration-200 hover:shadow-lg h-full">
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={event.image || "/placeholder.svg?height=400&width=600&query=tech+event"}
                  alt={event.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {event.category && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-primary/90 hover:bg-primary text-white">{event.category}</Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-5">
                <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {event.title}
                </h3>

                <div className="space-y-2 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formattedTime}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                </div>

                {event.price !== undefined && (
                  <div className="mt-4">
                    <Badge variant="outline" className="text-primary border-primary">
                      {event.price === 0 ? "Free" : `$${event.price}`}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

export type { Event }
