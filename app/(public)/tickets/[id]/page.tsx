import { notFound } from "next/navigation"
import { Calendar, Clock, MapPin, User, Mail, Ticket, CheckCircle2 } from "lucide-react"
import { connectToDatabase } from "@/lib/mongodb"
import FormSubmission from "@/models/FormSubmission"
import Event from "@/models/Event"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Metadata
export const metadata = {
  title: "Event Ticket",
  description: "Your virtual event ticket",
}

async function getTicketData(id: string) {
  try {
    await connectToDatabase()

    // Find the form submission by ID
    const submission = await FormSubmission.findById(id).lean()

    if (!submission) {
      return null
    }

    // Get the associated event
    const event = await Event.findById(submission.eventId).lean()

    return {
      submission,
      event,
    }
  } catch (error) {
    console.error("Error fetching ticket data:", error)
    return null
  }
}

export default async function TicketPage({ params }: { params: { id: string } }) {
  const ticketData = await getTicketData(params.id)

  if (!ticketData) {
    notFound()
  }

  const { submission, event } = ticketData

  // Format dates
  const formattedDate = event?.date
    ? new Date(event.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date not available"

  const formattedTime =
    event?.startTime && event?.endTime ? `${event.startTime} - ${event.endTime}` : "Time not specified"

  // Get form type (attendee, volunteer, speaker)
  const formType = submission.formType || "attendee"

  // Get name and email from form data
  const getName = () => {
    if (!submission.formData) return "N/A"

    // Try different possible field names for name
    return (
      submission.formData.name ||
      submission.formData.fullName ||
      submission.formData.firstName ||
      submission.formData["question_name"] ||
      "N/A"
    )
  }

  const getEmail = () => {
    if (!submission.formData) return "N/A"

    // Try different possible field names for email
    const emailKeys = Object.keys(submission.formData).filter(
      (key) => key === "email" || key === "emailAddress" || key.includes("email") || key.includes("Email"),
    )

    return emailKeys.length > 0 ? submission.formData[emailKeys[0]] : "N/A"
  }

  // Get role type color
  const roleTypeColor =
    {
      attendee: "bg-blue-500",
      volunteer: "bg-green-500",
      speaker: "bg-purple-500",
    }[formType] || "bg-indigo-500"

  // Get status
  const status = submission.status || "pending"
  const isApproved = status === "approved"

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Ticket status banner */}
        <div className={`mb-4 p-3 rounded-lg text-white text-center ${isApproved ? "bg-green-500" : "bg-amber-500"}`}>
          <div className="flex items-center justify-center gap-2">
            {isApproved ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Ticket Confirmed</span>
              </>
            ) : (
              <>
                <Clock className="h-5 w-5" />
                <span className="font-medium">Pending Approval</span>
              </>
            )}
          </div>
        </div>

        {/* Main ticket card */}
        <div className="bg-white rounded-xl overflow-hidden shadow-xl border border-gray-200">
          {/* Ticket header */}
          <div className={`${roleTypeColor} text-white p-6`}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold mb-1">{event?.title || "Event"}</h1>
                <div className="flex items-center text-sm opacity-90">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  <span>{formattedDate}</span>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-white/40 backdrop-blur-sm capitalize">{formType}</Badge>
            </div>
          </div>

          {/* Ticket body */}
          <div className="p-6">
            {/* Ticket number */}
            <div className="mb-6 text-center">
              <div className="text-xs text-gray-500 uppercase">Ticket #</div>
              <div className="text-xl font-mono font-bold">{submission._id.toString().substring(0, 8)}</div>
            </div>

            {/* Time and location */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-gray-700">
                <Clock className="h-5 w-5 mr-3 text-gray-500" />
                <span>{formattedTime}</span>
              </div>

              <div className="flex items-start text-gray-700">
                <MapPin className="h-5 w-5 mr-3 flex-shrink-0 text-gray-500" />
                <span>{event?.location || "Location not specified"}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200 my-6"></div>

            {/* Attendee information */}
            <div className="space-y-4 mb-6">
              <h2 className="font-semibold text-gray-800">Attendee Information</h2>

              <div className="flex items-center text-gray-700">
                <User className="h-5 w-5 mr-3 text-gray-500" />
                <span>{getName()}</span>
              </div>

              <div className="flex items-center text-gray-700">
                <Mail className="h-5 w-5 mr-3 text-gray-500" />
                <span>{getEmail()}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200 my-6"></div>

            {/* Important note */}
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
              <p className="font-medium mb-2">Important:</p>
              <p>
                Please present this ticket at the event entrance. You may be asked to show ID that matches the name on
                this ticket.
              </p>
            </div>
          </div>

          {/* Ticket footer */}
          <div className="bg-gray-50 p-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {isApproved ? "Approved" : "Submitted"} on{" "}
                {new Date(submission.updatedAt || submission.createdAt).toLocaleDateString()}
              </div>

              {event && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/events/${event.slug || event._id}`}>
                    <Ticket className="h-4 w-4 mr-1" />
                    Event Details
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Additional information */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This is an electronic ticket. No need to print.</p>
          <p className="mt-1">
            Questions? Contact the event organizer at{" "}
            <a
              href={`mailto:${event?.organizerEmail || "support@myevent.com"}`}
              className="text-blue-600 hover:underline"
            >
              {event?.organizerEmail || "support@myevent.com"}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
