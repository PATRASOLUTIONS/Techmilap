import { Suspense } from "react"
import { PublicEventList } from "@/components/events/public-event-list"
import { Loader2 } from "lucide-react"

async function getPublicEvents() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/events`, {
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status}`)
    }

    const data = await response.json()
    return data.events || []
  } catch (error) {
    console.error("Error fetching public events:", error)
    return []
  }
}

export default async function PublicEventsPage() {
  const events = await getPublicEvents()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Upcoming Events</h1>
      <Suspense fallback={<EventsLoading />}>
        <PublicEventList events={events} />
      </Suspense>
    </div>
  )
}

function EventsLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading events...</p>
    </div>
  )
}
