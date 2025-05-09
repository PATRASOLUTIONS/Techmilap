"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface EventCardProps {
  event: any
  onClick?: () => void
  showRegisterButton?: boolean
}

export function EventCard({ event, onClick, showRegisterButton = false }: EventCardProps) {
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
      router.push(`/my-events/details/${event.slug || event._id}`)
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

  // Get month and day for ticket stub
  const month = eventDate ? eventDate.toLocaleString("en-US", { month: "short" }).toUpperCase() : "TBA"
  const day = eventDate ? eventDate.getDate() : "--"

  return (
    <div className="group cursor-pointer h-full" onClick={handleCardClick}>
      {/* Ticket Container */}
      <div className="relative bg-white rounded-lg overflow-hidden h-full flex flex-col shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200">
        {/* Ticket Top - Image and Category */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={event.image || "/community-celebration.png"}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              // @ts-ignore - fallback to default image
              e.target.src = "/community-celebration.png"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

          {/* Date Stub */}
          <div className="absolute top-3 left-3 bg-white rounded-lg overflow-hidden shadow-md">
            <div className="bg-primary text-white text-center py-1 px-3 text-xs font-bold">{month}</div>
            <div className="text-center py-1 px-3 font-bold text-lg">{day}</div>
          </div>

          {/* Category Badge */}
          {event.category && (
            <Badge className="absolute top-3 right-3 bg-primary hover:bg-primary/90 text-white font-medium px-3 py-1">
              {event.category}
            </Badge>
          )}

          {/* Title on image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-primary/90 transition-colors">
              {event.title}
            </h3>
            <p className="text-xs text-white/80 mt-1">{organizerName !== "" ? `Organized by ${organizerName}` : ""}</p>
          </div>
        </div>

        {/* Ticket Perforation */}
        <div className="relative py-1 px-4">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-gray-100 rounded-r-full"></div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-gray-100 rounded-l-full"></div>
          <div className="border-t border-dashed border-gray-300 my-1"></div>
        </div>

        {/* Ticket Bottom - Details */}
        <div className="p-4 flex-grow space-y-3">
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

          {event.description && (
            <p className="mt-3 text-sm line-clamp-2 text-gray-600 group-hover:text-gray-800 transition-colors">
              {event.description}
            </p>
          )}

          {/* Buttons */}
          <div className="pt-3 flex gap-2">
            <Button
              asChild
              variant="default"
              className={`${showRegisterButton ? "flex-1" : "w-full"} group-hover:bg-primary/90 transition-colors`}
            >
              <Link href={`/my-events/details/${event.slug || event._id}`} className="flex items-center justify-center">
                View Details
                <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            {showRegisterButton && (
              <Button asChild variant="outline" className="flex-1 hover:bg-primary/10 transition-colors">
                <Link href={`/events/${event.slug || event._id}/register`}>Register</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
