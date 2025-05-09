"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { Calendar, MapPin, Download, Share2, ExternalLink, Clock, Check, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
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
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const { toast } = useToast()

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

  // Get ticket type color
  const ticketTypeColor =
    {
      attendee: "from-blue-500 to-blue-600",
      volunteer: "from-green-500 to-green-600",
      speaker: "from-purple-500 to-purple-600",
    }[ticket.ticketType] || "from-indigo-500 to-indigo-600"

  // Handle download ticket
  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      // Call the API to generate the PDF
      const response = await fetch("/api/tickets/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId: ticket._id,
          ticketType: "regular",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate ticket PDF")
      }

      // Get the PDF blob from the response
      const blob = await response.blob()

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob)

      // Create a temporary link element
      const link = document.createElement("a")
      link.href = url
      link.download = `ticket-${ticket.ticketNumber || ticket._id.substring(0, 6)}.pdf`

      // Append the link to the body
      document.body.appendChild(link)

      // Click the link to trigger the download
      link.click()

      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Ticket downloaded successfully!",
      })
    } catch (error) {
      console.error("Error downloading ticket:", error)
      toast({
        title: "Error",
        description: "Failed to download ticket. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
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

  // Handle send email
  const handleSendEmail = async () => {
    setIsSendingEmail(true)
    try {
      const response = await fetch("/api/tickets/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId: ticket._id,
          ticketType: "regular",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send email")
      }

      const data = await response.json()
      toast({
        title: "Email Sent",
        description: "Your ticket has been sent to your email address.",
      })
    } catch (error) {
      console.error("Error sending email:", error)
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="relative mx-auto max-w-4xl">
      {/* Main ticket container with shadow and hover effect */}
      <div className="relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200">
        {/* Ticket top edge perforations */}
        <div className="absolute top-0 left-0 right-0 h-2 flex justify-between items-center px-4">
          {[...Array(40)].map((_, i) => (
            <div key={`top-${i}`} className="w-1 h-1 rounded-full bg-gray-200"></div>
          ))}
        </div>

        {/* Ticket bottom edge perforations */}
        <div className="absolute bottom-0 left-0 right-0 h-2 flex justify-between items-center px-4">
          {[...Array(40)].map((_, i) => (
            <div key={`bottom-${i}`} className="w-1 h-1 rounded-full bg-gray-200"></div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Left ticket stub */}
          <div className="w-full md:w-1/4 bg-gray-50 p-4 flex flex-col items-center justify-center border-r border-dashed border-gray-300 relative">
            <div className="absolute -right-2.5 top-1/3 w-5 h-5 bg-white rounded-full border border-gray-300"></div>
            <div className="absolute -right-2.5 bottom-1/3 w-5 h-5 bg-white rounded-full border border-gray-300"></div>

            <div className="text-center mb-4">
              <div className="font-bold text-gray-700 mb-1">ADMIT ONE</div>
              <div className="text-xs text-gray-500">#{ticket.ticketNumber}</div>
            </div>

            <div className="bg-white p-2 rounded-md shadow-sm mb-4 w-32 h-32 flex items-center justify-center">
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`TICKET:${ticket._id}:${ticket.ticketType}:${ticket.eventId}`)}`}
                alt="QR Code"
                width={120}
                height={120}
              />
            </div>

            <div className="text-xs text-center text-gray-500 mb-2">Scan for entry</div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className={`bg-gradient-to-r ${ticketTypeColor} text-white w-full`}>Check In</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Check-in available at event</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Right ticket content */}
          <div className="w-full md:w-3/4 flex flex-col">
            {/* Ticket header */}
            <div className={`bg-gradient-to-r ${ticketTypeColor} text-white p-6`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{ticket.title}</h3>
                  <div className="flex items-center text-sm opacity-90">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    <span>{formattedDate}</span>
                    <span className="mx-1">•</span>
                    <Clock className="h-4 w-4 mr-1.5" />
                    <span>
                      {startTime} - {endTime}
                    </span>
                  </div>
                </div>
                <Badge className="bg-white/20 text-white border-white/40 backdrop-blur-sm">{ticketTypeDisplay}</Badge>
              </div>
            </div>

            {/* Ticket body */}
            <div className="p-6 flex-grow">
              {/* Location info */}
              {(ticket.venue || ticket.location) && (
                <div className="flex items-start mb-4 text-gray-700">
                  <MapPin className="h-5 w-5 mr-2 flex-shrink-0 text-gray-500" />
                  <div>
                    {ticket.venue && <div className="font-medium">{ticket.venue}</div>}
                    {ticket.location && <div className="text-sm text-gray-600">{ticket.location}</div>}
                  </div>
                </div>
              )}

              {/* Ticket details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Ticket Number</div>
                  <div className="font-medium">{ticket.ticketNumber}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Price</div>
                  <div className="font-medium">{ticket.price > 0 ? `$${ticket.price.toFixed(2)}` : "Free"}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className="font-medium text-green-600 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    Confirmed
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Type</div>
                  <div className="font-medium capitalize">{ticket.ticketType}</div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start" onClick={handleSendEmail} disabled={isSendingEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  {isSendingEmail ? "Sending..." : "Send to Email"}
                </Button>
                <Button variant="outline" className="justify-start" onClick={handleDownload} disabled={isDownloading}>
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? "Downloading..." : "Download"}
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={handleAddToCalendar}
                  disabled={isAddingToCalendar}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {isAddingToCalendar ? "Adding..." : "Add to Calendar"}
                </Button>
                <Button variant="outline" className="justify-start" onClick={handleTransfer} disabled={isTransferring}>
                  <Share2 className="h-4 w-4 mr-2" />
                  {isTransferring ? "Processing..." : "Transfer"}
                </Button>
              </div>
            </div>

            {/* Ticket footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-xs text-gray-500">Issued on {new Date().toLocaleDateString()}</div>
              {ticket.slug && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/events/${ticket.slug}`}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Event
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
