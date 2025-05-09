"use client"

import Link from "next/link"
import Image from "next/image"
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PublicEventCardProps {
  event: any
}

export function PublicEventCard({ event }: PublicEventCardProps) {
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

  // Create a random ticket number based on event ID for visual effect
  const ticketNumber = event._id ? event._id.slice(-8).toUpperCase() : "TKT12345"

  return (
    <div className="group h-full transform-gpu transition-all duration-300 hover:-translate-y-1">
      {/* Ticket Container */}
      <div className="relative bg-white rounded-xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
        {/* Ticket Stub - Left Side */}
        <div className="absolute left-0 top-0 bottom-0 w-[60px] bg-gray-50 border-r border-dashed border-gray-200 hidden sm:flex flex-col items-center justify-center z-10">
          <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white text-center py-1 px-2 text-xs font-bold w-full">
            {month}
          </div>
          <div className="text-center py-2 font-bold text-2xl text-gray-800">{day}</div>
          <div className="h-px w-10 bg-gray-200 my-2"></div>
    
        </div>

        {/* Main Ticket Content */}
        <div className="sm:ml-[60px]">
          {/* Ticket Top - Image and Category */}
          <div className="relative h-48 overflow-hidden">
            <Image
              src={event.image || "/placeholder.svg?height=400&width=600&query=tech+event"}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                // @ts-ignore - fallback to default image
                e.target.src = "/vibrant-tech-event.png"
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

            {/* Small Date Stub (mobile only) */}
            <div className="absolute top-3 left-3 bg-white rounded-lg overflow-hidden shadow-md sm:hidden">
              <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white text-center py-1 px-3 text-xs font-bold">
                {month}
              </div>
              <div className="text-center py-1 px-3 font-bold text-lg">{day}</div>
            </div>

            {/* Category Badge */}
            {event.category && (
              <Badge className="absolute top-3 right-3 bg-blue-500 hover:bg-blue-600 text-white font-medium px-3 py-1">
                {event.category}
              </Badge>
            )}

            {/* Title on image */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-blue-200 transition-colors">
                {event.title}
              </h3>
              <p className="text-xs text-white/80 mt-1">
                {organizerName !== "" ? `Organized by ${organizerName}` : ""}
              </p>
            </div>
          </div>

          {/* Ticket Perforation */}
          <div className="relative py-1 px-4">
            <div className="flex justify-between">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="w-2 h-2 rounded-full bg-gray-100"></div>
              ))}
            </div>
          </div>

          {/* Ticket Bottom - Details */}
          <div className="p-4 flex-grow space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-gray-700">{formattedDate}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-gray-700">{formattedTime}</span>
              </div>
              {event.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="line-clamp-1 text-gray-700">{event.location}</span>
                </div>
              )}
            </div>

            {event.description && (
              <p className="mt-3 text-sm line-clamp-2 text-gray-600 group-hover:text-gray-800 transition-colors">
                {event.description}
              </p>
            )}

            {/* Button */}
            <div className="pt-3">
              <Button
                asChild
                variant="default"
                className="w-full bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 transition-colors"
              >
                <Link href={`/events/${event.slug || event._id}`} className="flex items-center justify-center">
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-0 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
