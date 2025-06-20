"use client"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TicketCard } from "@/components/tickets/ticket-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar,
  AlertCircle,
  Ticket,
  Clock,
  Mail,
  MapPin,
  Download,
  Share2,
  ExternalLink,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import QRCode from "qrcode"
import { useSession } from "next-auth/react"
import { logWithTimestamp } from "@/utils/logger"

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
  const [sentEmailIds, setSentEmailIds] = useState<Set<string>>(new Set())
  const [retryCount, setRetryCount] = useState(0)
  const { data: session } = useSession()
  const [isSendingBulkEmails, setIsSendingBulkEmails] = useState(false)

  const fetchTickets = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching tickets...", forceRefresh ? "(forced refresh)" : "")
      console.log("Current user email:", session?.user?.email)

      // Add timestamp to prevent caching
      const timestamp = new Date().getTime()
      const url = `/api/tickets/my-tickets?t=${timestamp}${forceRefresh ? "&refresh=true" : ""}`
      console.log("Fetching from URL:", url)

      const response = await fetch(url, {
        // Add cache control to prevent stale data
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
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
      console.log("Tickets data received, total tickets:", data.tickets?.all?.length || 0)

      // Add more detailed logging
      if (data.tickets && data.tickets.all) {
        console.log("All tickets count:", data.tickets.all.length)
        console.log(
          "Ticket types:",
          data.tickets.all.map((t: any) => t.ticketType || t.formType),
        )
        console.log("Form submission tickets:", data.tickets.all.filter((t: any) => t.isFormSubmission).length)
        console.log(
          "Email-based tickets:",
          data.tickets.all.filter(
            (t: any) => t.email === session?.user?.email || t.attendeeEmail === session?.user?.email,
          ).length,
        )
      }

      setDebugInfo(data)

      // Check if data has the expected structure
      if (!data.tickets) {
        throw new Error("Invalid response format: missing tickets property")
      }

      // Filter out tickets that are not form submissions
      const filteredTickets = {
        ...data.tickets,
        all: data.tickets.all.filter((t: any) => t.isFormSubmission),
        upcoming: data.tickets.upcoming.filter((t: any) => t.isFormSubmission),
        past: data.tickets.past.filter((t: any) => t.isFormSubmission),
      }

      setTickets(filteredTickets)

      // Show success toast on forced refresh
      if (forceRefresh && data.tickets.all.length > 0) {
        toast({
          title: "Tickets Refreshed",
          description: `Found ${data.tickets.all.length} tickets.`,
        })
      } else if (forceRefresh && data.tickets.all.length === 0) {
        toast({
          title: "No Tickets Found",
          description: "We couldn't find any tickets associated with your account.",
          variant: "destructive",
        })
      }
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

  // Fetch tickets when component mounts or retry count changes
  const userId = session?.user?.id;
  useEffect(() => {
    if (userId) {
      fetchTickets(retryCount > 0)
    }
  }, [retryCount, userId])

  // Function to retry fetching tickets
  const retryFetch = () => {
    setRetryCount((prev) => prev + 1)
  }

  const sendTicketEmailIfNeeded = async (ticket: any): Promise<boolean> => {
    logWithTimestamp("info", `[sendTicketEmailIfNeeded] Called for ticket: ${ticket._id}`, { ticketStatus: ticket.status, isFormSubmission: ticket.isFormSubmission });
    if (sentEmailIds.has(ticket._id)) {
      logWithTimestamp("info", `[sendTicketEmailIfNeeded] Email already processed for ticket ${ticket._id} in this session. Skipping.`);
      return false; // Indicate not sent in this call, but already processed
    }

    let emailSentSuccessfully = false;

    if (ticket.isFormSubmission && ticket.status === "confirmed") {
      logWithTimestamp("info", `[sendTicketEmailIfNeeded] Conditions met for ticket ${ticket._id}. Attempting to send email.`);
      try {
        console.log("Sending email for newly approved ticket:", ticket._id)

        const response = await fetch("/api/tickets/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticketId: ticket._id,
            ticketType: "submission",
            formType: ticket.formType || ticket.ticketType,
          }),
        })

        if (response.ok) {
          console.log("Email sent successfully for ticket:", ticket._id)
          logWithTimestamp("info", `[sendTicketEmailIfNeeded] API call successful for ${ticket._id}. Updating sentEmailIds.`);
          setSentEmailIds((prev) => new Set([...prev, ticket._id]))
          emailSentSuccessfully = true;
        } else {
          const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
          logWithTimestamp("error", `[sendTicketEmailIfNeeded] API call FAILED for ${ticket._id}. Status: ${response.status}`, errorData);
          console.error(`Failed to send email for ticket ${ticket._id}, status: ${response.status}`, errorData);
        }
      } catch (error) {
        logWithTimestamp("error", `[sendTicketEmailIfNeeded] Exception during email sending for ${ticket._id}`, error);
        console.error("Error sending automatic ticket email:", error)
      }
    } else {
      logWithTimestamp("info", `[sendTicketEmailIfNeeded] Conditions NOT met for ticket ${ticket._id}. Status: ${ticket.status}, isFormSubmission: ${ticket.isFormSubmission}`);
    }
    return emailSentSuccessfully;
  }

  const handleSendAllConfirmationEmails = async () => {
    setIsSendingBulkEmails(true)
    let emailsAttempted = 0
    let emailsSentSuccessfully = 0

    logWithTimestamp("info", "[handleSendAllConfirmationEmails] Initiated.");

    if (!loading && tickets.all && tickets.all.length > 0) {
      const eligibleTickets = tickets.all.filter(
        (ticket) => ticket.isFormSubmission && ticket.status === "confirmed" && !sentEmailIds.has(ticket._id),
      )
      logWithTimestamp("info", `[handleSendAllConfirmationEmails] Found ${eligibleTickets.length} eligible tickets.`);


      if (eligibleTickets.length === 0) {
        toast({
          title: "No Emails to Send",
          description: "All confirmation emails for eligible tickets have already been processed in this session or there are no new confirmed tickets.",
        })
        setIsSendingBulkEmails(false)
        return
      }

      toast({
        title: "Sending Emails...",
        description: `Attempting to send ${eligibleTickets.length} confirmation email(s).`,
      })

      for (const ticket of eligibleTickets) {
        emailsAttempted++
        logWithTimestamp("info", `[handleSendAllConfirmationEmails] Processing ticket ${ticket._id} (${emailsAttempted}/${eligibleTickets.length})`);
        const success = await sendTicketEmailIfNeeded(ticket)
        if (success) {
          emailsSentSuccessfully++
        }
      }
    } else {
      logWithTimestamp("info", "[handleSendAllConfirmationEmails] No tickets loaded or tickets.all is empty.");
    }
    toast({
      title: "Email Sending Complete",
      description: `Successfully sent ${emailsSentSuccessfully} out of ${emailsAttempted} email(s).`,
    })
    logWithTimestamp("info", `[handleSendAllConfirmationEmails] Completed. Sent: ${emailsSentSuccessfully}/${emailsAttempted}`);
    setIsSendingBulkEmails(false)
  }


  // Filter tickets by type
  const attendeeTickets =
    tickets.all?.filter((ticket) => ticket.ticketType === "attendee" || ticket.formType === "attendee") || []

  const volunteerTickets =
    tickets.all?.filter((ticket) => ticket.ticketType === "volunteer" || ticket.formType === "volunteer") || []

  const speakerTickets =
    tickets.all?.filter((ticket) => ticket.ticketType === "speaker" || ticket.formType === "speaker") || []

  return (
    <div className="space-y-6 container py-8">
      {loading && (
        <div className="fixed inset-0 bg-black/5 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
            <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading your tickets...</span>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Tickets</h1>
          <p className="text-muted-foreground">
            View tickets for events you're attending, volunteering at, or speaking at
          </p>
          {session?.user?.email && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing tickets for: <span className="font-medium">{session.user.email}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => retryFetch()} disabled={loading}>
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Tickets
              </>
            )}
          </Button>
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-indigo-600" />
            <span className="font-medium">{loading ? "..." : tickets.all?.length || 0} Tickets</span>
          </div>
          {session?.user?.role !== "user" && tickets.all?.some(t => t.isFormSubmission && t.status === "confirmed") && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSendAllConfirmationEmails}
              disabled={loading || isSendingBulkEmails}
            >
              {isSendingBulkEmails ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {isSendingBulkEmails ? "Sending Emails..." : "Send Confirmation Emails"}
            </Button>
          )}
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
          {/* <TabsTrigger value="debug">Debug</TabsTrigger> */}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={retryFetch} />
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
            <EmptyState type="ticket" onRetry={retryFetch} />
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={retryFetch} />
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
            <EmptyState type="upcoming" onRetry={retryFetch} />
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={retryFetch} />
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
            <EmptyState type="past" onRetry={retryFetch} />
          )}
        </TabsContent>

        <TabsContent value="attendee" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={retryFetch} />
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
            <EmptyState type="attendee" onRetry={retryFetch} />
          )}
        </TabsContent>

        <TabsContent value="volunteer" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={retryFetch} />
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
            <EmptyState type="volunteer" onRetry={retryFetch} />
          )}
        </TabsContent>

        <TabsContent value="speaker" className="mt-6">
          {loading ? (
            <TicketsLoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={retryFetch} />
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
            <EmptyState type="speaker" onRetry={retryFetch} />
          )}
        </TabsContent>

        <TabsContent value="debug" className="mt-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Debug Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-3 rounded border">
                <h4 className="font-medium mb-2">Ticket Counts</h4>
                <ul className="space-y-1 text-sm">
                  <li>All Tickets: {tickets.all?.length || 0}</li>
                  <li>Upcoming: {tickets.upcoming?.length || 0}</li>
                  <li>Past: {tickets.past?.length || 0}</li>
                  <li>Attendee: {attendeeTickets.length}</li>
                  <li>Volunteer: {volunteerTickets.length}</li>
                  <li>Speaker: {speakerTickets.length}</li>
                  <li>Form Submissions: {tickets.all?.filter((t) => t.isFormSubmission)?.length || 0}</li>
                  <li>
                    Email-based:{" "}
                    {tickets.all?.filter(
                      (t) => t.email === session?.user?.email || t.attendeeEmail === session?.user?.email,
                    )?.length || 0}
                  </li>
                  <li>Retry Count: {retryCount}</li>
                </ul>
              </div>
              <div className="bg-white p-3 rounded border">
                <h4 className="font-medium mb-2">User Information</h4>
                <div className="text-sm">
                  <p>User ID: {session?.user?.id || "Not available"}</p>
                  <p>Email: {session?.user?.email || "Not available"}</p>
                  <p>Role: {session?.user?.role || "Not available"}</p>
                  <p>Status: {error ? "Error" : "Success"}</p>
                  <p>Loading: {loading ? "Yes" : "No"}</p>
                  <p>Error: {error || "None"}</p>
                </div>
              </div>
            </div>
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

  console.log("Rendering ticket:", {
    index,
    id: ticket._id,
    type: ticket.ticketType || ticket.formType,
    isFormSubmission: ticket.isFormSubmission,
    event: ticket.event?.title,
    email: ticket.email || ticket.attendeeEmail,
  })

  // For form submissions, use the FormSubmissionTicket component
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

  // Safely access event data with fallbacks
  const event = ticket.event || {}

  // Safely format date with error handling
  const formattedDate = (() => {
    try {
      if (!event.date) return "Date not available"
      return new Date(event.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Date format error"
    }
  })()

  const formattedTime =
    event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : "Time not specified"

  const roleType = ticket.formType || ticket.ticketType || "attendee"

  // Create the virtual ticket URL - ensure it's a complete URL with http/https
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
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
    if (!ticket.formData) return ticket.attendeeName || "N/A"

    // Try different possible field names for name
    let nameField =
      ticket.attendeeName ||
      ticket.formData.name ||
      ticket.formData.fullName ||
      ticket.formData.firstName ||
      ticket.formData["question_name"] ||
      ticket.userName

    // If name is still not found, look for custom question fields containing "name"
    if (!nameField || nameField === "N/A") {
      // Look for keys that match the pattern "Question name" followed by a timestamp
      const nameKeys = Object.keys(ticket.formData).filter(
        (key) =>
          key.toLowerCase().includes("question name") ||
          (key.toLowerCase().includes("question") && key.toLowerCase().includes("name")),
      )

      if (nameKeys.length > 0) {
        nameField = ticket.formData[nameKeys[0]]
      }
    }

    // If we have firstName and lastName, combine them
    if (!nameField && ticket.formData.firstName && ticket.formData.lastName) {
      nameField = `${ticket.formData.firstName} ${ticket.formData.lastName}`
    }

    return nameField || "N/A"
  }

  const getEmail = () => {
    if (!ticket.formData) return ticket.attendeeEmail || ticket.userEmail || "N/A"

    // Try different possible field names for email
    // Also look for dynamic field names containing "email"
    const emailValue = ticket.attendeeEmail || ticket.userEmail || ticket.formData.email || ticket.formData.emailAddress

    if (emailValue) return emailValue

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
          ticketType: ticket.isFormSubmission ? "submission" : undefined,
          formType: ticket.formType || roleType,
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
        author: "Tech Milap Platform",
        creator: "Tech Milap Platform",
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

      // Generate QR code and add it to the PDF
      try {
        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData, {
          margin: 1,
          width: 150,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })

        // Add QR code to PDF
        doc.addImage(qrCodeDataUrl, "PNG", 130, 85, 40, 40)
      } catch (qrError) {
        console.error("Error generating QR code for PDF:", qrError)
        // Add placeholder if QR code generation fails
        doc.setFillColor(240, 240, 240)
        doc.rect(130, 85, 40, 40, "F")
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text("QR Code", 150, 105, { align: "center" })
        doc.text("Generation Failed", 150, 110, { align: "center" })
      }

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
        if (!isNaN(startHour) && !isNaN(startMinute)) {
          startDate.setHours(startHour, startMinute, 0)
        }
      } else {
        endDate.setHours(startDate.getHours() + 2) // Default 2 hours if no end time
      }

      if (event.endTime) {
        const [endHour, endMinute] = event.endTime.split(":").map(Number)
        if (!isNaN(endHour) && !isNaN(endMinute)) {
          endDate.setHours(endHour, endMinute, 0)
        }
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
                  {isSendingEmail ? "Sending..." : "Share via Email"}
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
                Approved on {new Date(ticket.purchasedAt || ticket.createdAt || new Date()).toLocaleDateString()}
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

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <h2 className="text-xl font-semibold">Error Loading Tickets</h2>
      <p className="text-muted-foreground text-center max-w-md">{message}</p>
      <div className="flex gap-4">
        <Button onClick={onRetry}>Try Again</Button>
        <Button variant="outline" asChild>
          <Link href="/events">Browse Events</Link>
        </Button>
      </div>
    </div>
  )
}

function EmptyState({
  type,
  onRetry,
}: { type: "upcoming" | "past" | "attendee" | "volunteer" | "speaker" | "ticket"; onRetry: () => void }) {
  const messages = {
    upcoming: "You don't have any upcoming event tickets.",
    past: "You don't have any past event tickets.",
    attendee: "You don't have any attendee tickets.",
    volunteer: "You don't have any volunteer tickets.",
    speaker: "You don't have any speaker tickets.",
    ticket: "You don't have any tickets yet.",
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
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  )
}
