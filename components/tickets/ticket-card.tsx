"use client"
import Link from "next/link"
import { format } from "date-fns"
import { Calendar, Download, ExternalLink, Share2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

interface TicketCardProps {
  ticket: any
  index: number
}

export function TicketCard({ ticket, index }: TicketCardProps) {
  const { toast } = useToast()

  // Generate a unique ticket number based on user ID and event ID
  const ticketNumber = `T-${ticket._id.toString().substring(0, 5)}-${ticket.ticketType.substring(0, 3).toUpperCase()}`

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date not specified"
    try {
      return format(new Date(dateString), "MMMM d, yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ""
    return timeString
  }

  const getTicketTypeLabel = () => {
    switch (ticket.ticketType) {
      case "attendee":
        return "General Admission"
      case "volunteer":
        return "Volunteer Pass"
      case "speaker":
        return "Speaker Pass"
      case "vip":
        return "VIP Pass"
      default:
        return "Event Pass"
    }
  }

  const handleDownload = () => {
    toast({
      title: "Download started",
      description: "Your ticket is being prepared for download.",
    })
    // In a real implementation, this would generate and download a PDF ticket
  }

  const handleAddToCalendar = () => {
    // Create Google Calendar URL
    const startDate = new Date(ticket.date)
    const endDate = ticket.endDate ? new Date(ticket.endDate) : new Date(startDate.getTime() + 3600000) // Default to 1 hour

    if (ticket.startTime) {
      const [startHours, startMinutes] = ticket.startTime.split(":").map(Number)
      startDate.setHours(startHours, startMinutes)
    }

    if (ticket.endTime) {
      const [endHours, endMinutes] = ticket.endTime.split(":").map(Number)
      endDate.setHours(endHours, endMinutes)
    }

    const eventTitle = encodeURIComponent(ticket.title)
    const eventLocation = encodeURIComponent(ticket.venue || ticket.location || "")
    const eventDetails = encodeURIComponent(
      `Your ${getTicketTypeLabel()} for ${ticket.title}. Ticket #: ${ticketNumber}`,
    )

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${startDate.toISOString().replace(/-|:|\.\d+/g, "")}/${endDate.toISOString().replace(/-|:|\.\d+/g, "")}&details=${eventDetails}&location=${eventLocation}`

    window.open(googleCalendarUrl, "_blank")

    toast({
      title: "Calendar event",
      description: "Opening calendar to add this event.",
    })
  }

  const handleTransferTicket = () => {
    toast({
      title: "Transfer ticket",
      description: "This feature is coming soon!",
    })
  }

  const getTicketPrice = () => {
    if (!ticket.price) return "Free"
    return typeof ticket.price === "number" ? `$${ticket.price.toFixed(2)}` : ticket.price
  }

  return (
    <Card className="overflow-hidden border bg-slate-50">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">{ticket.title}</h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(ticket.date)}
                {ticket.startTime && ` • ${formatTime(ticket.startTime)}`}
                {ticket.endTime && ` - ${formatTime(ticket.endTime)}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {ticket.venue || ticket.location || "Location not specified"}
              </p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {getTicketTypeLabel()}
            </Badge>
          </div>

          <Separator className="my-4" />

          <div className="flex">
            <div className="flex-1">
              <h4 className="font-medium mb-3">Ticket Information</h4>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ticket Number</span>
                  <span className="text-sm font-medium">{ticketNumber}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-sm font-medium">{getTicketPrice()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-sm font-medium text-emerald-600">Confirmed</span>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Button variant="outline" className="w-full justify-start" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Ticket
                </Button>

                <Button variant="outline" className="w-full justify-start" onClick={handleAddToCalendar}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Add to Calendar
                </Button>

                <Button variant="outline" className="w-full justify-start" onClick={handleTransferTicket}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Transfer Ticket
                </Button>

                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/events/${ticket.eventId || ticket._id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Event Details
                  </Link>
                </Button>
              </div>
            </div>

            <div className="ml-6 flex flex-col items-center">
              <div className="w-32 h-32 bg-gray-200 flex items-center justify-center">
                {/* This would be a real QR code in production */}
                <div className="w-24 h-24 border-2 border-black grid grid-cols-5 grid-rows-5">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`border border-black/10 ${Math.random() > 0.6 ? "bg-black" : "bg-white"}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-center mt-2 text-muted-foreground">Present this QR code at the event</p>

              <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">Check In</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
