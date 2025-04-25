"use client"

import Link from "next/link"
import Image from "next/image"
import { Calendar, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface EventCardProps {
  event: any
  onClick?: () => void
}

export function EventCard({ event, onClick }: EventCardProps) {
  // Safely format the date with fallback
  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date not specified"

  return (
    <Card
      className="overflow-hidden flex flex-col h-full cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
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
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1">{event.title}</CardTitle>
        <CardDescription>
          {typeof event.organizer === "object"
            ? `Organized by ${event.organizer.firstName} ${event.organizer.lastName}`
            : "Organized by TechEventPlanner"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>
        <p className="mt-3 text-sm line-clamp-2">{event.description}</p>
      </CardContent>
      <CardFooter className="pt-2">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/events/${event.slug || event._id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
