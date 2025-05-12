"use client"
import Image from "next/image"
import Link from "next/link"
import { Calendar, MapPin, Clock, ExternalLink, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TicketCardProps {
  ticket: any
  index?: number
  onClick?: () => void
}

export default function TicketCard({ ticket, index, onClick }: TicketCardProps) {
  if (!ticket) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg text-center">
        <p className="text-gray-500">Invalid ticket data</p>
      </div>
    )
  }

  // Safely extract ticket data with fallbacks
  const ticketId = ticket._id || `ticket-${index || 0}`
  const eventTitle = ticket.event?.title || ticket.title || "Event"
  const eventImage = ticket.event?.image || ticket.image || "/vibrant-tech-event.png"
  const eventCategory = ticket.event?.category || ticket.category || null
  const eventLocation = ticket.event?.location || ticket.location || null
  const organizerName = ticket.event?.organizerName || ticket.organizerName || "Event Organizer"
  const ticketNumber = ticket.ticketNumber || (ticketId ? ticketId.substring(0, 8).toUpperCase() : "TICKET")

  // Format date with fallback
  let formattedDate = "Date TBD"
  let formattedTime = "Time TBD"

  try {
    const eventDate = ticket.event?.date ? new Date(ticket.event.date) : ticket.date ? new Date(ticket.date) : null

    if (eventDate) {
      formattedDate = eventDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      formattedTime = eventDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    }
  } catch (e) {
    console.error("Error formatting date:", e)
  }

  return (
    <div
      className="group cursor-pointer h-full transform-gpu transition-all duration-300 hover:-translate-y-1"
      onClick={onClick}
    >
      {/* Ticket Container */}
      <div className="relative bg-white rounded-xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
        {/* Ticket Stub - Left Side */}
        <div className="absolute left-0 top-0 bottom-0 w-[60px] bg-gray-50 border-r border-dashed border-gray-200 hidden sm:flex flex-col items-center justify-center z-10">
          <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white text-center py-1 px-2 text-xs font-bold w-full">
            TKT
          </div>
          <div className="text-center py-2 font-bold text-lg text-gray-800">#{ticketNumber.substring(0, 4)}</div>
          <div className="h-px w-10 bg-gray-200 my-2"></div>
          <div className="text-xs font-mono text-gray-500 rotate-90 tracking-widest mt-4">ADMIT ONE</div>
        </div>

        {/* Main Ticket Content */}
        <div className="sm:ml-[60px]">
          {/* Ticket Top - Image and Category */}
          <div className="relative h-48 overflow-hidden">
            <Image
              src={eventImage || "/placeholder.svg"}
              alt={eventTitle}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                // @ts-ignore - fallback to default image
                e.target.src = "/vibrant-tech-event.png"
                // Prevent infinite loop
                e.currentTarget.onerror = null
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

            {/* Category Badge */}
            {eventCategory && (
              <Badge className="absolute top-3 right-3 bg-blue-500 hover:bg-blue-600 text-white font-medium px-3 py-1">
                {eventCategory}
              </Badge>
            )}

            {/* Title on image */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-blue-200 transition-colors">
                {eventTitle}
              </h3>
              <p className="text-xs text-white/80 mt-1">Organized by {organizerName}</p>
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
              {eventLocation && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="line-clamp-1 text-gray-700">{eventLocation}</span>
                </div>
              )}
            </div>

            <div className="pt-3 flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/tickets/${ticketId}`}>
                  View Ticket
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="icon">
                <Link href={`/tickets/${ticketId}/download`} target="_blank">
                  <Download className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
