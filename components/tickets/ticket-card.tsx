"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { Calendar, MapPin, Download, Share2, ExternalLink, Clock, Check, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

interface TicketCardProps {
  ticket: {
    _id: string
    eventId?: string
    title?: string
    date?: string
    endDate?: string
    startTime?: string
    endTime?: string
    venue?: string
    location?: string
    image?: string
    slug?: string
    ticketType?: "attendee" | "volunteer" | "speaker"
    ticketNumber?: string
    price?: number
    status?: string
    userName?: string
    userEmail?: string
    userPhone?: string
    event?: any
  }
  index: number
}

export function TicketCard({ ticket, index }: TicketCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()

  // Handle missing data
  const event = ticket.event || {}
  const eventTitle = ticket.title || event.title || "Event"
  const eventDate = ticket.date || event.date
  const eventLocation = ticket.location || event.location
  const eventVenue = ticket.venue || event.venue
  const ticketNumber = ticket.ticketNumber || ticket._id.toString().substring(0, 8).toUpperCase()
  const ticketType = ticket.ticketType || "attendee"
  const ticketPrice = ticket.price || 0
  const ticketStatus = ticket.status || "confirmed"
  const eventSlug = ticket.slug || event.slug
  const userName = ticket.userName || "Attendee"
  const userEmail = ticket.userEmail || "No email provided"

  // Format date and time
  const formattedDate = eventDate ? format(new Date(eventDate), "MMMM d, yyyy") : "Date TBD"
  const startTime = ticket.startTime || event.startTime || "TBD"
  const endTime = ticket.endTime || event.endTime || "TBD"

  // Get ticket type display name
  const ticketTypeDisplay =
    {
      attendee: "Attendee Pass",
      volunteer: "Volunteer Pass",
      speaker: "Speaker Pass",
    }[ticketType] || "Event Pass"

  // Get ticket type color
  const ticketTypeColor =
    {
      attendee: "from-blue-500 to-blue-600",
      volunteer: "from-green-500 to-green-600",
      speaker: "from-purple-500 to-purple-600",
    }[ticketType] || "from-indigo-500 to-indigo-600"

  // Create QR code data with all required information
  const qrCodeData = JSON.stringify({
    ticketId: ticket._id,
    ticketNumber: ticketNumber,
    eventName: eventTitle,
    participantName: userName,
    email: userEmail,
    designation: ticketTypeDisplay,
    type: ticketType,
    eventId: ticket.eventId || event._id || "unknown",
  })

  // Generate QR code URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`

  // Handle download ticket
  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      // Create a new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Set document properties
      doc.setProperties({
        title: `${eventTitle} - Ticket`,
        subject: "Event Ticket",
        author: "MyEvent Platform",
        creator: "MyEvent Platform",
      })

      // Add title
      doc.setFontSize(24)
      doc.setTextColor(33, 33, 33)
      doc.text(eventTitle, 105, 20, { align: "center" })

      // Add ticket type
      doc.setFontSize(16)
      doc.setTextColor(100, 100, 100)
      doc.text(ticketTypeDisplay, 105, 30, { align: "center" })

      // Add horizontal line
      doc.setDrawColor(200, 200, 200)
      doc.line(20, 35, 190, 35)

      // Add event details section
      doc.setFontSize(14)
      doc.setTextColor(33, 33, 33)
      doc.text("Event Details", 20, 45)

      doc.setFontSize(12)
      doc.text(`Date: ${formattedDate}`, 20, 55)
      doc.text(`Time: ${startTime} - ${endTime}`, 20, 62)

      if (eventLocation) {
        doc.text(`Location: ${eventLocation}`, 20, 69)
      }

      if (eventVenue) {
        doc.text(`Venue: ${eventVenue}`, 20, 76)
      }

      // Add ticket details section
      doc.setFontSize(14)
      doc.text("Ticket Information", 20, 90)

      doc.setFontSize(12)
      doc.text(`Ticket #: ${ticketNumber}`, 20, 100)
      doc.text(`Status: ${ticketStatus.charAt(0).toUpperCase() + ticketStatus.slice(1)}`, 20, 107)
      doc.text(`Price: ${ticketPrice > 0 ? `$${ticketPrice.toFixed(2)}` : "Free"}`, 20, 114)

      // Add attendee information section
      doc.setFontSize(14)
      doc.text("Attendee Information", 20, 130)

      doc.setFontSize(12)
      doc.text(`Name: ${userName}`, 20, 140)
      doc.text(`Email: ${userEmail}`, 20, 147)

      // Add QR code
      // We'll add a placeholder for the QR code and note that it should be added
      doc.setFillColor(240, 240, 240)
      doc.rect(130, 90, 40, 40, "F")
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text("QR Code", 150, 110, { align: "center" })
      doc.text("For event check-in", 150, 115, { align: "center" })

      // Add footer
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 270, { align: "center" })
      doc.text("Present this ticket at the event entrance", 105, 275, { align: "center" })

      // Save the PDF
      doc.save(`ticket-${ticketNumber}.pdf`)

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
    try {
      // Create Google Calendar URL
      const startDate = eventDate ? new Date(eventDate) : new Date()
      const endDate = ticket.endDate ? new Date(ticket.endDate) : new Date(startDate)

      // If we have start and end times, use them
      if (startTime && startTime !== "TBD") {
        const [startHour, startMinute] = startTime.split(":").map(Number)
        if (!isNaN(startHour) && !isNaN(startMinute)) {
          startDate.setHours(startHour, startMinute, 0)
        }
      } else {
        endDate.setHours(startDate.getHours() + 2) // Default 2 hours if no end time
      }

      if (endTime && endTime !== "TBD") {
        const [endHour, endMinute] = endTime.split(":").map(Number)
        if (!isNaN(endHour) && !isNaN(endMinute)) {
          endDate.setHours(endHour, endMinute, 0)
        }
      }

      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDate
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
        )}00Z&details=${encodeURIComponent(`Your ${ticketTypeDisplay} for ${eventTitle}. Ticket #: ${ticketNumber}`)}&location=${encodeURIComponent(eventVenue || "")}${encodeURIComponent(eventLocation ? `, ${eventLocation}` : "")}`

      window.open(googleCalendarUrl, "_blank")

      toast({
        title: "Calendar Event Created",
        description: "Event has been added to your calendar",
      })
    } catch (error) {
      console.error("Error adding to calendar:", error)
      toast({
        title: "Error",
        description: "Failed to add event to calendar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingToCalendar(false)
    }
  }

  // Handle share via WhatsApp
  const handleShare = () => {
    setIsSharing(true)
    try {
      // Check if we have a phone number
      if (!ticket.userPhone) {
        // If no phone number is available, prompt the user to enter one
        const phoneNumber = prompt("Enter the phone number to share this ticket (include country code):")
        if (!phoneNumber) {
          setIsSharing(false)
          return
        }

        // Format phone number (remove spaces, dashes, etc.)
        const formattedPhone = phoneNumber.replace(/[\s\-()]/g, "")
        shareViaWhatsApp(formattedPhone)
      } else {
        // Use the stored phone number
        shareViaWhatsApp(ticket.userPhone)
      }
    } catch (error) {
      console.error("Error sharing ticket:", error)
      toast({
        title: "Error",
        description: "Failed to share ticket. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSharing(false)
    }
  }

  // Helper function to share via WhatsApp
  const shareViaWhatsApp = (phoneNumber: string) => {
    // Create the message text
    const messageText = `
🎟️ *Event Ticket: ${eventTitle}*

📅 Date: ${formattedDate}
⏰ Time: ${startTime} - ${endTime}
📍 Location: ${eventLocation || "TBD"}
${eventVenue ? `🏢 Venue: ${eventVenue}` : ""}

🎫 Ticket #: ${ticketNumber}
🏷️ Type: ${ticketTypeDisplay}

Please present this ticket at the event entrance.
    `

    // Create WhatsApp URL
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(messageText)}`

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, "_blank")

    toast({
      title: "WhatsApp Opened",
      description: "Sharing ticket via WhatsApp",
    })
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
              <div className="text-xs text-gray-500">#{ticketNumber}</div>
            </div>

            {/* QR Code - Fixed with direct img tag as fallback */}
            <div className="bg-white p-2 rounded-md shadow-sm mb-4 w-32 h-32 flex items-center justify-center relative">
              {/* Primary QR code with Image component */}
              <div className="relative w-full h-full">
                <Image
                  src={qrCodeUrl || "/placeholder.svg"}
                  alt="Ticket QR Code"
                  fill
                  className="object-contain"
                  onError={(e) => {
                    // If Image component fails, we'll show a fallback
                    console.error("QR code image failed to load with Image component")
                    const imgElement = e.currentTarget as HTMLImageElement
                    imgElement.style.display = "none"
                    const fallbackElement = document.getElementById(`qr-fallback-${ticket._id}`)
                    if (fallbackElement) {
                      fallbackElement.style.display = "block"
                    }
                  }}
                />
              </div>

              {/* Fallback QR code with regular img tag */}
              <img
                id={`qr-fallback-${ticket._id}`}
                src={qrCodeUrl || "/placeholder.svg"}
                alt="Ticket QR Code (Fallback)"
                className="w-full h-full object-contain hidden"
                style={{ display: "none" }}
                onError={() => {
                  console.error("QR code image failed to load with fallback img tag")
                  // If even the fallback fails, show an error message
                  const fallbackElement = document.getElementById(`qr-fallback-${ticket._id}`)
                  if (fallbackElement) {
                    fallbackElement.outerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-xs text-center p-2">QR Code<br/>Unavailable</div>`
                  }
                }}
              />
            </div>

            <div className="text-xs text-center text-gray-500 mb-2">For event check-in</div>
          </div>

          {/* Right ticket content */}
          <div className="w-full md:w-3/4 flex flex-col">
            {/* Ticket header */}
            <div className={`bg-gradient-to-r ${ticketTypeColor} text-white p-6`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{eventTitle}</h3>
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
              {(eventVenue || eventLocation) && (
                <div className="flex items-start mb-4 text-gray-700">
                  <MapPin className="h-5 w-5 mr-2 flex-shrink-0 text-gray-500" />
                  <div>
                    {eventVenue && <div className="font-medium">{eventVenue}</div>}
                    {eventLocation && <div className="text-sm text-gray-600">{eventLocation}</div>}
                  </div>
                </div>
              )}

              {/* Ticket details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Ticket Number</div>
                  <div className="font-medium">{ticketNumber}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Price</div>
                  <div className="font-medium">{ticketPrice > 0 ? `$${ticketPrice.toFixed(2)}` : "Free"}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className="font-medium text-green-600 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    {ticketStatus.charAt(0).toUpperCase() + ticketStatus.slice(1)}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Type</div>
                  <div className="font-medium capitalize">{ticketType}</div>
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
                <Button variant="outline" className="justify-start" onClick={handleShare} disabled={isSharing}>
                  <Share2 className="h-4 w-4 mr-2" />
                  {isSharing ? "Sharing..." : "Share via WhatsApp"}
                </Button>
              </div>
            </div>

            {/* Ticket footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-xs text-gray-500">Issued on {new Date().toLocaleDateString()}</div>
              {eventSlug && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/events/${eventSlug}`}>
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
