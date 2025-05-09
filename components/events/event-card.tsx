"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { Calendar, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface EventCardProps {
  event: any
  onClick?: () => void
}

export function EventCard({ event, onClick }: EventCardProps) {
  const router = useRouter()

  // Handle card click to navigate to explore page
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on the View Details button
    if ((e.target as HTMLElement).closest("a")) {
      return
    }

    // Use the provided onClick or navigate to explore page
    if (onClick) {
      onClick()
    } else {
      router.push(`/explore/${event.slug || event._id}`)
    }
  }

  // Format date with fallback
  const eventDate = event.date ? new Date(event.date) : null
  const formattedDate = eventDate
    ? eventDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date TBA"

  // Format time with fallback
  const formattedTime = eventDate
    ? eventDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "Time TBA"

  // Get organizer name
  const organizerName =
    typeof event.organizer === "object"
      ? `${event.organizer.firstName || ""} ${event.organizer.lastName || ""}`.trim()
      : "Event Organizer"

  return (
    <Card
      className="overflow-hidden flex flex-col h-full cursor-pointer transition-all duration-300 hover:shadow-lg border-gray-200 hover:border-primary/20"
      onClick={handleCardClick}
    >
      <div className="relative h-48 overflow-hidden">
        <Image
          src={event.image || "/community-celebration.png"}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
          onError={(e) => {
            // @ts-ignore - fallback to default image
            e.target.src = "/community-celebration.png"
          }}
        />
        {event.category && (
          <Badge className="absolute top-3 right-3 bg-primary hover:bg-primary/90 text-white font-medium px-3 py-1">
            {event.category}
          </Badge>
        )}
      </div>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="line-clamp-1 text-xl font-bold">{event.title}</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {organizerName !== "" ? `Organized by ${organizerName}` : ""}
        </p>
      </CardHeader>
      <CardContent className="pb-2 flex-grow space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-primary" />
            <span className="text-gray-700">{formattedDate}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-primary" />
            <span className="text-gray-700">{formattedTime}</span>
          </div>
          {event.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              <span className="line-clamp-1 text-gray-700">{event.location}</span>
            </div>
          )}
        </div>
        {event.description && <p className="mt-3 text-sm line-clamp-2 text-gray-600">{event.description}</p>}
      </CardContent>
      <CardFooter className="pt-2 pb-4">
        <Button asChild variant="default" className="w-full">
          <Link href={`/events/${event.slug || event._id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
