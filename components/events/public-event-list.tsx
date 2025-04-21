"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatDate } from "@/lib/utils"
import { Calendar, MapPin, Users, Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function PublicEventList({ events }) {
  const [visibleEvents, setVisibleEvents] = useState(6)

  const loadMore = () => {
    setVisibleEvents((prev) => prev + 6)
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No events found</h3>
        <p className="text-muted-foreground">Check back later for upcoming events.</p>
      </div>
    )
  }

  // Log the events data to the console
  console.log("Events data in PublicEventList:", events)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.slice(0, visibleEvents).map((event) => (
          <Card key={event._id} className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="relative h-48">
              <Image
                src={event.image || "/community-celebration.png"}
                alt={event.title}
                fill
                className="object-cover"
                onError={(e) => {
                  // @ts-ignore - fallback to default image
                  e.target.src = "/community-celebration.png"
                }}
              />
              {event.category && (
                <Badge className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700">{event.category}</Badge>
              )}
              {event.isFeatured && (
                <Badge
                  variant="outline"
                  className="absolute top-2 left-2 bg-amber-500 text-white border-amber-500 hover:bg-amber-600 hover:border-amber-600"
                >
                  Featured
                </Badge>
              )}
            </div>
            <CardContent className="pt-6 flex-grow">
              <h3 className="text-xl font-bold mb-2 line-clamp-2">{event.title}</h3>
              <p className="text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                  <span>{formatDate(event.date)}</span>
                </div>
                {event.startTime && (
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-blue-600" />
                    <span>
                      {event.startTime} {event.endTime ? `- ${event.endTime}` : ""}
                    </span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-2 text-blue-600" />
                  <span>
                    {event.attendees?.length || 0} / {event.capacity || "Unlimited"}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 pb-6">
              <Button asChild className="w-full group">
                <Link href={`/events/${event.slug || event._id || event.id}`}>
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {visibleEvents < events.length && (
        <div className="text-center pt-4">
          <Button onClick={loadMore} variant="outline" className="px-8">
            Load More Events
          </Button>
        </div>
      )}
    </div>
  )
}
