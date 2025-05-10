"use client"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TicketCard } from "@/components/tickets/ticket-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Calendar, AlertCircle, Ticket, Clock, Mail, MapPin, Download, Share2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import QRCode from "qrcode"

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<{
    upcoming: any[]
    past: any[]
    all: any[]
  }>({
    upcoming: [],
    past: [],
    all: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("Fetching tickets...")
        const response = await fetch("/api/tickets/my-tickets?exclude=organizer")
        console.log("Response status:", response.status)

        if (!response.ok) {
          let errorMessage = `Failed to fetch tickets: ${response.status} ${response.statusText}`
          try {
            const errorData = await response.json()
            errorMessage = `${errorMessage} - ${errorData.error || "Unknown error"}`
            setDebugInfo(errorData)
          } catch (e) {
            console.error("Error parsing error response:", e)
          }
          throw new Error(errorMessage)
        }

        const data = await response.json()
        console.log("Tickets data:", data)
        setDebugInfo(data)

        // Check if data has the expected structure
        if (!data.tickets) {
          throw new Error("Invalid response format: missing tickets property")
        }

        setTickets(data.tickets)
      } catch (error) {
        console.error("Error fetching tickets:", error)
        setError(error instanceof Error ? error.message : "Failed to load tickets")
        toast({
          title: "Error",
          description: "Failed to load your tickets. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [toast])

  // Filter tickets by type
  const attendeeTickets =
    tickets.all?.filter((ticket) => ticket.ticketType === "attendee" || ticket.formType === "attendee") || []

  const volunteerTickets =
    tickets.all?.filter((ticket) => ticket.ticketType === "volunteer" || ticket.formType === "volunteer") || []

  const speakerTickets =
    tickets.all?.filter((ticket) => ticket.ticketType === "speaker" || ticket.formType === "speaker") || []

  return (
    <div className="space-y-6 container py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Tickets</h1>
          <p className="text-muted-foreground">
            View tickets for events you're attending, volunteering at, or speaking at
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-indigo-600" />
          <span className="font-medium">{loading ? "..." : tickets.all?.length || 0} Tickets</span>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All ({loading ? "..." : tickets.all?.length || 0})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({loading ? "..." : tickets.upcoming?.length || 0})</TabsTrigger>
          <TabsTrigger value="past">Past ({loading ? "..." : tickets.past?.length || 0})</TabsTrigger>
          <TabsTrigger value="attendee">Attendee ({loading ? "..." : attendeeTickets.length})</TabsTrigger>
          <TabsTrigger value="volunteer">Volunteer ({loading ? "..." : volunteerTickets.length})</TabsTrigger>
          <TabsTrigger value="speaker">Speaker ({loading ? "..." : speakerTickets.length})</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : tickets.all?.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-1">
              {tickets.all.map((ticket, index) => (
                <TicketItem
                  key={`${ticket._id}-${ticket.ticketType || ticket.formType || "unknown"}-${index}`}
                  ticket={ticket}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="ticket" />
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : tickets.upcoming?.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-1">
              {tickets.upcoming.map((ticket, index) => (
                <TicketItem
                  key={`${ticket._id}-${ticket.ticketType || ticket.formType || "unknown"}-${index}`}
                  ticket={ticket}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="upcoming" />
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : tickets.past?.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-1">
              {tickets.past.map((ticket, index) => (
                <TicketItem
                  key={`${ticket._id}-${ticket.ticketType || ticket.formType || "unknown"}-${index}`}
                  ticket={ticket}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="past" />
          )}
        </TabsContent>

        <TabsContent value="attendee" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : attendeeTickets.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-1">
              {attendeeTickets.map((ticket, index) => (
                <TicketItem
                  key={`${ticket._id}-${ticket.ticketType || ticket.formType || "unknown"}-${index}`}
                  ticket={ticket}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="attendee" />
          )}
        </TabsContent>

        <TabsContent value="volunteer" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : volunteerTickets.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-1">
              {volunteerTickets.map((ticket, index) => (
                <TicketItem
                  key={`${ticket._id}-${ticket.ticketType || ticket.formType || "unknown"}-${index}`}
                  ticket={ticket}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="volunteer" />
          )}
        </TabsContent>

        <TabsContent value="speaker" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : speakerTickets.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-1">
              {speakerTickets.map((ticket, index) => (
                <TicketItem
                  key={`${ticket._id}-${ticket.ticketType || ticket.formType || "unknown"}-${index}`}
                  ticket={ticket}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="speaker" />
          )}
        </TabsContent>

        <TabsContent value="debug" className="mt-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Debug Information</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// New component to handle both regular tickets and form submission tickets
function TicketItem({ ticket, index }: { ticket: any; index: number }) {
  // Check if this is a form submission or a regular ticket
  if (!ticket) {
    console.error("Ticket is undefined or null", { index })
    return <div className="p-4 bg-red-50 text-red-500 rounded-lg">Invalid ticket data</div>
  }

  console.log("Rendering ticket:", { index, ticket })

  if (ticket.isFormSubmission) {
    return <FormSubmissionTicket ticket={ticket} index={index} />
  } else {
    return <TicketCard ticket={ticket} index={index} />
  }
}

// QR Code component that generates QR code client-side
function TicketQRCode({ data, size = 120 }: { data: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const generateQR = async () => {
      try {
        await QRCode.toCanvas(canvasRef.current, data, {
          width: size,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })
        setIsLoaded(true)
      } catch (err) {
        console.error("Error generating QR code:", err)
        setError("Failed to generate QR code")
      }
    }

    generateQR()
  }, [data, size])

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-md">
        <p className="text-xs text-gray-500 text-center p-2">QR Code Generation Failed</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${isLoaded ? "opacity-100" : "opacity-0"}`}
        width={size}
        height={size}
      />
    </div>
  )
}

// Component to display form submission as a ticket
function FormSubmissionTicket({ ticket, index }: { ticket: any; index: number }) {
  const [showAllDetails, setShowAllDetails] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false)
  const { toast } = useToast()

  const event = ticket.event || {}
  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date not available"

  const formattedTime =
    event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : "Time not specified"

  const roleType = ticket.formType || ticket.ticketType || "attendee"

  // Create the virtual ticket URL - ensure it's a complete URL with http/https
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
  const virtualTicketUrl = `${baseUrl}/tickets/${ticket._id}`

  // QR code data - ensure it's the complete URL
  const qrCodeData = virtualTicketUrl.startsWith("http")
    ? virtualTicketUrl
    : `https://${virtualTicketUrl.replace(/^\/\//, "")}`

  // Get role type color
  const roleTypeColor =
    {
      attendee: "from-blue-500 to-blue-600",
      volunteer: "from-green-500 to-green-600",
      speaker: "from-purple-500 to-purple-600",
    }[roleType] || "from-indigo-500 to-indigo-600"

  // Extract name and email from form data
  const getName = () => {
    if (!ticket.formData) return "N/A"

    // Try different possible field names for name
    const nameField =
      ticket.formData.name ||
      ticket.formData.fullName ||
      ticket.formData.firstName ||
      ticket.formData["question_name"] ||
      "N/A"

    return nameField
  }

  const getEmail = () => {
    if (!ticket.formData) return "N/A"

    // Try different possible field names for email
    // Also look for dynamic field names containing "email"
    const emailKeys = Object.keys(ticket.formData).filter(
      (key) => key === "email" || key === "emailAddress" || key.includes("email") || key.includes("Email"),
    )

    return emailKeys.length > 0 ? ticket.formData[emailKeys[0]] : "N/A"
  }

  // Get mobile number from form data
  const getMobileNumber = () => {
    if (!ticket.formData) return null

    // Try different possible field names for mobile number
    const mobileKeys = Object.keys(ticket.formData).filter(
      (key) =>
        key === "mobile" ||
        key === "mobileNumber" ||
        key === "phone" ||
        key === "phoneNumber" ||
        key === "question_mobile" ||
        key.includes("mobile") ||
        key.includes("phone"),
    )

    return mobileKeys.length > 0 ? ticket.formData[mobileKeys[0]] : null
  }

  // Handle send email
  const handleSendEmail = async () => {
    setIsSendingEmail(true)
    try {
      console.log("Sending email for ticket:", ticket._id)

      const response = await fetch("/api/tickets/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId: ticket._id,
          ticketType: "submission",
          formType: roleType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Email sending error:", errorData)
        throw new Error(errorData.error || "Failed to send email")
      }

      const data = await response.json()
      console.log("Email sent successfully:", data)

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
        title: `${event.title || "Event"} - ${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Pass`,
        subject: "Event Ticket",
        author: "MyEvent Platform",
        creator: "MyEvent Platform",
      })

      // Add title
      doc.setFontSize(24)
      doc.setTextColor(33, 33, 33)
      doc.text(event.title || "Event", 105, 20, { align: "center" })

      // Add ticket type
      doc.setFontSize(16)
      doc.setTextColor(100, 100, 100)
      doc.text(`${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Pass`, 105, 30, { align: "center" })

      // Add horizontal line
      doc.setDrawColor(200, 200, 200)
      doc.line(20, 35, 190, 35)

      // Add event details section
      doc.setFontSize(14)
      doc.setTextColor(33, 33, 33)
      doc.text("Event Details", 20, 45)

      doc.setFontSize(12)
      doc.text(`Date: ${formattedDate}`, 20, 55)
      doc.text(`Time: ${formattedTime}`, 20, 62)

      if (event.location) {
        doc.text(`Location: ${event.location}`, 20, 69)
      }

      // Add ticket details section
      doc.setFontSize(14)
      doc.text("Ticket Information", 20, 85)

      doc.setFontSize(12)
      doc.text(`Ticket #: ${ticket._id.substring(0, 6)}`, 20, 95)
      doc.text(`Status: Confirmed`, 20, 102)
      doc.text(`Type: ${roleType.charAt(0).toUpperCase() + roleType.slice(1)}`, 20, 109)

      // Add attendee information section
      doc.setFontSize(14)
      doc.text("Attendee Information", 20, 125)

      doc.setFontSize(12)
      doc.text(`Name: ${getName()}`, 20, 135)
      doc.text(`Email: ${getEmail()}`, 20, 142)

      // Add additional form data if available
      if (ticket.formData) {
        let yPos = 155

        doc.setFontSize(14)
        doc.text("Additional Information", 20, yPos)
        yPos += 10

        doc.setFontSize(12)

        Object.entries(ticket.formData)
          .filter(
            ([key]) =>
              key !== "name" &&
              key !== "email" &&
              !key.includes("Email") &&
              !key.includes("email") &&
              key !== "fullName" &&
              key !== "firstName" &&
              key !== "question_name",
          )
          .forEach(([key, value]) => {
            const formattedKey = key
              .replace(/([A-Z])/g, " $1")
              .replace(/_/g, " ")
              .replace(/^./, (str) => str.toUpperCase())

            // Check if we need to add a new page
            if (yPos > 250) {
              doc.addPage()
              yPos = 20
            }

            doc.text(`${formattedKey}: ${String(value)}`, 20, yPos)
            yPos += 7
          })
      }

      // Add QR code placeholder
      doc.setFillColor(240, 240, 240)
      doc.rect(130, 85, 40, 40, "F")
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text("QR Code", 150, 105, { align: "center" })
      doc.text("Scan for entry", 150, 110, { align: "center" })

      // Add virtual ticket URL
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 255)
      doc.text("View virtual ticket:", 130, 135)
      doc.text(virtualTicketUrl, 130, 140, { maxWidth: 60 })

      // Add footer
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 270, { align: "center" })
      doc.text("Present this ticket at the event entrance", 105, 275, { align: "center" })

      // Save the PDF
      doc.save(`${roleType}-pass-${ticket._id.substring(0, 6)}.pdf`)

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
      const startDate = event.date ? new Date(event.date) : new Date()
      const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate)

      // If we have start and end times, use them
      if (event.startTime) {
        const [startHour, startMinute] = event.startTime.split(":").map(Number)
        startDate.setHours(startHour, startMinute, 0)
      } else {
        endDate.setHours(startDate.getHours() + 2) // Default 2 hours if no end time
      }

      if (event.endTime) {
        const [endHour, endMinute] = event.endTime.split(":").map(Number)
        endDate.setHours(endHour, endMinute, 0)
      }

      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title || "Event")}&dates=${startDate
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
        )}00Z&details=${encodeURIComponent(`Your ${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Pass for ${event.title || "Event"}. Ticket #: ${ticket._id.substring(0, 6)}
View your ticket: ${virtualTicketUrl}`)}&location=${encodeURIComponent(event.location || "")}`

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
      // Try to get mobile number from form data
      const mobileNumber = getMobileNumber()

      // If no mobile number is found in form data, prompt the user to enter one
      if (!mobileNumber) {
        const phoneNumber = prompt("Enter the phone number to share this ticket (include country code):")
        if (!phoneNumber) {
          setIsSharing(false)
          return
        }

        // Format phone number (remove spaces, dashes, etc.)
        const formattedPhone = phoneNumber.replace(/[\s\-$]/g, "")
        shareViaWhatsApp(formattedPhone)
      } else {
        // Use the mobile number from form data
        const formattedPhone = String(mobileNumber).replace(/[\s\-$]/g, "")
        shareViaWhatsApp(formattedPhone)
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
🎟️ *Event Ticket: ${event.title || "Event"}*

📅 Date: ${formattedDate}
⏰ Time: ${formattedTime}
📍 Location: ${event.location || "TBD"}

🎫 Ticket #: ${ticket._id.substring(0, 6)}
🏷️ Type: ${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Pass
👤 Name: ${getName()}

🔗 View your ticket: ${virtualTicketUrl}

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
              <div className="font-bold text-gray-700 mb-1 uppercase">{roleType} Pass</div>
              <div className="text-xs text-gray-500">#{ticket._id.substring(0, 6)}</div>
            </div>

            <div className="bg-white p-2 rounded-md shadow-sm mb-4 w-32 h-32 flex items-center justify-center">
              <TicketQRCode data={qrCodeData} size={120} />
            </div>

            <a
              href={qrCodeData}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-center text-indigo-600 hover:underline mb-2"
            >
              Tap to view virtual ticket
            </a>
          </div>

          {/* Right ticket content */}
          <div className="w-full md:w-3/4 flex flex-col">
            {/* Ticket header */}
            <div className={`bg-gradient-to-r ${roleTypeColor} text-white p-6`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{event.title || "Event"}</h3>
                  <div className="flex items-center text-sm opacity-90">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    <span>{formattedDate}</span>
                  </div>
                </div>
                <Badge className="bg-white/20 text-white border-white/40 backdrop-blur-sm capitalize">{roleType}</Badge>
              </div>
            </div>

            {/* Ticket body */}
            <div className="p-6 flex-grow">
              {/* Time and location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-700">
                  <Clock className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{formattedTime}</span>
                </div>

                <div className="flex items-start text-gray-700">
                  <MapPin className="h-5 w-5 mr-2 flex-shrink-0 text-gray-500" />
                  <span>{event.location || "Location not specified"}</span>
                </div>
              </div>

              {/* Attendee information */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Attendee Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Name</div>
                    <div className="font-medium">{getName()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Email</div>
                    <div className="font-medium">{getEmail()}</div>
                  </div>
                </div>
              </div>

              {/* Additional form details */}
              {ticket.formData && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-700">Application Details</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllDetails(!showAllDetails)}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      {showAllDetails ? "View Less" : "View More Details"}
                    </Button>
                  </div>

                  {showAllDetails && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      {Object.entries(ticket.formData)
                        .filter(
                          ([key]) =>
                            key !== "name" && key !== "email" && !key.includes("Email") && !key.includes("email"),
                        )
                        .map(([key, value]) => (
                          <div key={key} className="grid grid-cols-3 gap-2">
                            <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                            <span className="col-span-2">{String(value)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

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
              <div className="text-xs text-gray-500">
                Approved on {new Date(ticket.purchasedAt || ticket.createdAt).toLocaleDateString()}
              </div>
              {event.slug && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/events/${event.slug}`}>
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

function TicketsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-64 w-full" />
      ))}
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <h2 className="text-xl font-semibold">Error Loading Tickets</h2>
      <p className="text-muted-foreground text-center max-w-md">{message}</p>
      <Button onClick={() => window.location.reload()}>Try Again</Button>
    </div>
  )
}

function EmptyState({ type }: { type: "upcoming" | "past" | "attendee" | "volunteer" | "speaker" | "ticket" }) {
  const messages = {
    upcoming: "You don&#x27;t have any upcoming event tickets.",
    past: "You don&#x27;t have any past event tickets.",
    attendee: "You don&#x27;t have any attendee tickets.",
    volunteer: "You don&#x27;t have any volunteer tickets.",
    speaker: "You don&#x27;t have any speaker tickets.",
    ticket: "You don&#x27;t have any tickets yet.",
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12 bg-slate-50 rounded-lg border border-slate-200">
      <Calendar className="h-12 w-12 text-slate-400" />
      <h2 className="text-xl font-semibold">No Tickets Found</h2>
      <p className="text-muted-foreground text-center max-w-md">{messages[type]}</p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/events">Browse Events</Link>
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    </div>
  )
}
