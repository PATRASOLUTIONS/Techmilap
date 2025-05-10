import { notFound } from "next/navigation"
import { connectToDatabase } from "@/lib/mongodb"
import FormSubmission from "@/models/FormSubmission"
import Event from "@/models/Event"

// Metadata
export const metadata = {
  title: "Ticket Debug",
  description: "Debug view for ticket data",
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

export default async function TicketDebugPage({ params }: { params: { id: string } }) {
  const ticketData = await getTicketData(params.id)

  if (!ticketData) {
    notFound()
  }

  const { submission, event } = ticketData

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Ticket Debug View</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Submission Data</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[400px] text-sm">
            {JSON.stringify(submission, null, 2)}
          </pre>
        </div>

        {event && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Event Data</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[400px] text-sm">
              {JSON.stringify(event, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
