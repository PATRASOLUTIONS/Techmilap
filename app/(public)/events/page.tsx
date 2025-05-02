import { Suspense } from "react"
import { PublicEventList } from "@/components/events/public-event-list"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { EventListSkeleton } from "@/components/events/event-list-skeleton"

// Simple function to fetch all events
async function getAllEvents() {
  try {
    // Use the new simplified API endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const url = `${baseUrl}/api/all-events`

    console.log("Fetching events from:", url)

    const response = await fetch(url, {
      next: { revalidate: 60 }, // Cache for 1 minute
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch events")
    }

    console.log(`Fetched ${data.events?.length || 0} events`)
    return { events: data.events || [], error: null }
  } catch (error) {
    console.error("Error fetching events:", error)
    return {
      events: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export default async function EventsPage() {
  // Fetch all events
  const { events, error } = await getAllEvents()

  return (
    <div className="pt-16">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">All Events</h1>
          <p className="text-muted-foreground mt-2">Browse all our exciting events</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Events</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <section aria-labelledby="events-heading" className="mb-12">
          <div className="mt-6">
            <Suspense fallback={<EventsLoading />}>
              {events.length > 0 ? (
                <PublicEventList events={events} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">{error ? "Failed to load events." : "No events found."}</p>
                  {!error && <p className="mt-2">Check back soon for new events!</p>}
                </div>
              )}
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  )
}

function EventsLoading() {
  return (
    <div className="py-4">
      <EventListSkeleton />
    </div>
  )
}
