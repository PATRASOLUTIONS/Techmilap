"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { Calendar, MapPin, Download, Share2, ExternalLink, Clock, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TicketCardProps {
  ticket: {
    _id: string
    eventId: string
    title: string
    date: string
    endDate?: string
    startTime?: string
    endTime?: string
    venue?: string
    location?: string
    image?: string
    slug?: string
    ticketType: "attendee" | "volunteer" | "speaker"
    ticketNumber: string
    price: number
    status: string
  }
  index: number
}

export function TicketCard({ ticket, index }: TicketCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)

  // Format date and time
  const formattedDate = ticket.date ? format(new Date(ticket.date), "MMMM d, yyyy") : "Date TBD"
  const startTime = ticket.startTime || "TBD"
  const endTime = ticket.endTime || "TBD"

  // Get ticket type display name
  const ticketTypeDisplay = {
    attendee: "Attendee Pass",
    volunteer: "Volunteer Pass",
    speaker: "Speaker Pass",
  }[ticket.ticketType]

  // Handle download ticket
  const handleDownload = () => {
    setIsDownloading(true)
    // Simulate download delay
    setTimeout(() => {
      setIsDownloading(false)
      alert("Ticket download feature coming soon!")
    }, 1000)
  }

  // Handle add to calendar
  const handleAddToCalendar = () => {
    setIsAddingToCalendar(true)
    // Simulate delay
    setTimeout(() => {
      setIsAddingToCalendar(false)

      // Create Google Calendar URL
      const startDate = ticket.date ? new Date(ticket.date) : new Date()
      const endDate = ticket.endDate ? new Date(ticket.endDate) : new Date(startDate)
      endDate.setHours(startDate.getHours() + 2) // Default 2 hours if no end date

      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ticket.title)}&dates=${startDate
        .toISOString()
        .replace(/-|:|\.\d+/g, "")
        .slice(0, 8)}T${startDate
        .toISOString()
        .replace(/-|:|\.\d+/g, "")
        .slice(9, 13)}00Z/${endDate
        .toISOString()
        .replace(/-|:|\.\d+/g, "")
        .slice(0, 8)}T${endDate
        .toISOString()
        .replace(/-|:|\.\d+/g, "")
        .slice(
          9,
          13,
        )}00Z&details=${encodeURIComponent(`Your ${ticketTypeDisplay} for ${ticket.title}. Ticket #: ${ticket.ticketNumber}`)}&location=${encodeURIComponent(ticket.venue || "")}${encodeURIComponent(ticket.location ? `, ${ticket.location}` : "")}`

      window.open(googleCalendarUrl, "_blank")
    }, 1000)
  }

  // Handle transfer ticket
  const handleTransfer = () => {
    setIsTransferring(true)
    // Simulate delay
    setTimeout(() => {
      setIsTransferring(false)
      alert("Ticket transfer feature coming soon!")
    }, 1000)
  }

  return (
    <Card className="overflow-hidden bg-slate-50 border-slate-200">
      <CardContent className="p-0">
        <div className="p-4 pb-2">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-xl font-bold line-clamp-1">{ticket.title}</h3>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
              {ticketTypeDisplay}
            </Badge>
          </div>

          <div className="flex items-center text-sm text-gray-600 mb-1">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            <span>{formattedDate}</span>
            <span className="mx-1">•</span>
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            <span>
              {startTime} - {endTime}
            </span>
          </div>

          {(ticket.venue || ticket.location) && (
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
              <span className="line-clamp-1">
                {ticket.venue}
                {ticket.location ? `, ${ticket.location}` : ""}
              </span>
            </div>
          )}
        </div>

        <div className="flex border-t border-slate-200">
          <div className="flex-1 p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Ticket Information</h4>

            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-gray-500">Ticket Number</div>
              <div className="font-medium text-right">{ticket.ticketNumber}</div>

              <div className="text-gray-500">Price</div>
              <div className="font-medium text-right">{ticket.price > 0 ? `$${ticket.price.toFixed(2)}` : "Free"}</div>

              <div className="text-gray-500">Status</div>
              <div className="font-medium text-right text-green-600 flex items-center justify-end">
                <Check className="h-3.5 w-3.5 mr-1" />
                Confirmed
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? "Downloading..." : "Download Ticket"}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleAddToCalendar}
                disabled={isAddingToCalendar}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {isAddingToCalendar ? "Adding..." : "Add to Calendar"}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleTransfer}
                disabled={isTransferring}
              >
                <Share2 className="h-4 w-4 mr-2" />
                {isTransferring ? "Processing..." : "Transfer Ticket"}
              </Button>

              {ticket.slug && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/events/${ticket.slug}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Event Details
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="w-1/3 p-4 flex flex-col items-center justify-center border-l border-slate-200">
            <div className="bg-white p-2 rounded-md shadow-sm mb-2 w-32 h-32 flex items-center justify-center">
              {/* Placeholder for QR code - in production, generate a real QR code */}
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`TICKET:${ticket._id}:${ticket.ticketType}:${ticket.eventId}`)}`}
                alt="QR Code"
                width={120}
                height={120}
              />
            </div>
            <p className="text-xs text-center text-gray-500">Present this QR code at the event</p>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">Check In</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Check-in available at event</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
